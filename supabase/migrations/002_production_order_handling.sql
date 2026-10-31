-- =============================================================================
-- LABSA | لَبسة — PostgreSQL Schema & Production Order Handling
-- Migration 002: Production Ready Orders, Atomic Checkout, Coupons & Reviews
-- =============================================================================

-- 1. Create Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id text PRIMARY KEY,
  code text UNIQUE NOT NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text,
  description_en text,
  discount_type text NOT NULL CHECK (discount_type IN ('fixed_egp', 'percentage')),
  discount_value integer NOT NULL CHECK (discount_value > 0),
  min_subtotal_egp integer NOT NULL DEFAULT 0 CHECK (min_subtotal_egp >= 0),
  max_discount_egp integer CHECK (max_discount_egp IS NULL OR max_discount_egp > 0),
  starts_at timestamptz,
  expires_at timestamptz,
  max_total_uses integer CHECK (max_total_uses IS NULL OR max_total_uses > 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Alter Orders Table for Production Hardening & Idempotency
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS request_fingerprint text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_title_snapshot jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_egp integer NOT NULL DEFAULT 0 CHECK (discount_egp >= 0);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_lookup_token text UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS lookup_hash text;

CREATE INDEX IF NOT EXISTS idx_orders_lookup_hash ON public.orders(lookup_hash);
CREATE INDEX IF NOT EXISTS idx_orders_customer_lookup_token ON public.orders(customer_lookup_token);
CREATE INDEX IF NOT EXISTS idx_orders_customer_normalized_mobile ON public.orders(customer_normalized_mobile);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 3. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_slug text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  comment text NOT NULL,
  reviewer_name text NOT NULL,
  order_number_reference text,
  is_verified_delivered_purchase boolean NOT NULL DEFAULT false,
  is_demo_sample boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_at timestamptz,
  moderated_by text,
  private_moderation_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- 4. Enable RLS on newly created tables
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Coupons RLS: Public can view active coupons; Admins have full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'Public can view active coupons'
  ) THEN
    CREATE POLICY "Public can view active coupons"
      ON public.coupons
      FOR SELECT
      USING (status = 'active' OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'Admins can manage coupons'
  ) THEN
    CREATE POLICY "Admins can manage coupons"
      ON public.coupons
      FOR ALL
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- Reviews RLS: Public can read approved reviews; Admins have full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Public can view approved reviews'
  ) THEN
    CREATE POLICY "Public can view approved reviews"
      ON public.reviews
      FOR SELECT
      USING (status = 'approved' OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Admins can manage reviews'
  ) THEN
    CREATE POLICY "Admins can manage reviews"
      ON public.reviews
      FOR ALL
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- Grant only the trusted server role access to these Data API tables.
GRANT SELECT, INSERT, UPDATE ON TABLE public.coupons, public.reviews TO service_role;

-- 5. Atomic Order Creation Function with Idempotency & Stock Locking
-- Authoritative database pricing & stock validation; protected against caller manipulation.
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order_id text,
  p_order_number text,
  p_idempotency_key text,
  p_customer_full_name text,
  p_customer_mobile text,
  p_customer_normalized_mobile text,
  p_governorate_code text,
  p_governorate_name_snapshot jsonb,
  p_city_or_area text,
  p_street_and_building text,
  p_landmark text,
  p_delivery_note text,
  p_items_snapshot jsonb,
  p_subtotal_egp integer,
  p_delivery_fee_egp integer,
  p_discount_egp integer,
  p_total_egp integer,
  p_payment_method text,
  p_payment_status text,
  p_payment_transfer_reference text,
  p_coupon_code text,
  p_coupon_title_snapshot jsonb,
  p_customer_lookup_token text,
  p_lookup_hash text,
  p_req_items jsonb, -- Array of { "variantId": string, "quantity": integer }
  p_request_fingerprint text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing_order record;
  v_item record;
  v_variant_rec record;
  v_coupon record;
  v_calc_subtotal integer := 0;
  v_calc_discount integer := 0;
  v_calc_total integer := 0;
  v_now timestamptz := clock_timestamp();
BEGIN
  -- 1. Idempotency Check with Request Fingerprint Binding
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT id, order_number, customer_lookup_token, subtotal_egp,
           delivery_fee_egp, discount_egp, total_egp, order_status,
           payment_status, created_at, request_fingerprint
    INTO v_existing_order
    FROM public.orders
    WHERE idempotency_key = p_idempotency_key;

    IF v_existing_order.id IS NOT NULL THEN
      -- Strict idempotency check: both stored fingerprint and incoming request fingerprint
      -- MUST exist and match exactly. A missing or mismatched fingerprint MUST NOT authorize a replay.
      IF p_request_fingerprint IS NULL
         OR p_request_fingerprint = ''
         OR v_existing_order.request_fingerprint IS NULL
         OR v_existing_order.request_fingerprint = ''
         OR v_existing_order.request_fingerprint <> p_request_fingerprint THEN
        RAISE EXCEPTION 'idempotency_conflict: Idempotency key already used with different order payload or missing fingerprint';
      END IF;

      -- Return safe idempotent replay DTO (does not decrement stock or re-consume coupon)
      RETURN jsonb_build_object(
        'id', v_existing_order.id,
        'order_number', v_existing_order.order_number,
        'customer_lookup_token', v_existing_order.customer_lookup_token,
        'subtotal_egp', v_existing_order.subtotal_egp,
        'delivery_fee_egp', v_existing_order.delivery_fee_egp,
        'discount_egp', v_existing_order.discount_egp,
        'total_egp', v_existing_order.total_egp,
        'order_status', v_existing_order.order_status,
        'payment_status', v_existing_order.payment_status,
        'created_at', v_existing_order.created_at,
        'is_idempotent_replay', true
      );
    END IF;
  END IF;

  -- 2. Lock & Validate each product variant stock and fetch authoritative price from database
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_req_items) AS ( "variantId" text, "quantity" integer )
  LOOP
    IF v_item."quantity" <= 0 OR v_item."quantity" > 50 THEN
      RAISE EXCEPTION 'invalid_quantity: quantity must be positive safe integer between 1 and 50';
    END IF;

    -- Lock variant record and verify parent product status & pricing
    SELECT pv.id, pv.product_id, pv.stock, pv.sku, pv.color_key, pv.size,
           p.price_egp, p.status AS product_status
    INTO v_variant_rec
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_item."variantId"
    FOR UPDATE OF pv;

    IF v_variant_rec.id IS NULL THEN
      RAISE EXCEPTION 'variant_not_found: variant % does not exist in catalog', v_item."variantId";
    END IF;

    IF v_variant_rec.product_status <> 'active' THEN
      RAISE EXCEPTION 'product_unavailable: product % is not currently active for purchase', v_variant_rec.product_id;
    END IF;

    IF v_variant_rec.stock < v_item."quantity" THEN
      RAISE EXCEPTION 'insufficient_stock: variant % has % in stock, requested %',
        v_item."variantId", v_variant_rec.stock, v_item."quantity";
    END IF;

    -- Authoritatively calculate subtotal in database from verified catalog prices
    v_calc_subtotal := v_calc_subtotal + (v_variant_rec.price_egp * v_item."quantity");

    -- Decrement variant inventory atomically
    UPDATE public.product_variants
    SET stock = stock - v_item."quantity",
        updated_at = v_now
    WHERE id = v_item."variantId";
  END LOOP;

  -- Revalidate subtotal against caller value if provided
  IF p_subtotal_egp IS NOT NULL AND p_subtotal_egp <> v_calc_subtotal THEN
    RAISE EXCEPTION 'pricing_mismatch: subtotal % does not match authoritative database subtotal %',
      p_subtotal_egp, v_calc_subtotal;
  END IF;

  -- 3. Lock & Validate Coupon (if provided)
  IF p_coupon_code IS NOT NULL AND p_coupon_code <> '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE code = upper(p_coupon_code)
    FOR UPDATE;

    IF v_coupon IS NULL THEN
      RAISE EXCEPTION 'invalid_coupon: coupon code does not exist';
    END IF;

    IF v_coupon.status <> 'active' THEN
      RAISE EXCEPTION 'coupon_inactive: coupon is not active';
    END IF;

    IF v_coupon.starts_at IS NOT NULL AND v_now < v_coupon.starts_at THEN
      RAISE EXCEPTION 'coupon_not_started: coupon is not yet active';
    END IF;

    IF v_coupon.expires_at IS NOT NULL AND v_now > v_coupon.expires_at THEN
      RAISE EXCEPTION 'coupon_expired: coupon has expired';
    END IF;

    IF v_coupon.max_total_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_total_uses THEN
      RAISE EXCEPTION 'coupon_exhausted: coupon usage limit reached';
    END IF;

    IF v_calc_subtotal < v_coupon.min_subtotal_egp THEN
      RAISE EXCEPTION 'coupon_min_subtotal: cart subtotal does not meet minimum of %', v_coupon.min_subtotal_egp;
    END IF;

    -- Calculate authoritative discount in DB
    IF v_coupon.discount_type = 'percentage' THEN
      v_calc_discount := round((v_calc_subtotal * v_coupon.discount_value)::numeric / 100)::integer;
      IF v_coupon.max_discount_egp IS NOT NULL AND v_calc_discount > v_coupon.max_discount_egp THEN
        v_calc_discount := v_coupon.max_discount_egp;
      END IF;
    ELSE
      v_calc_discount := LEAST(v_coupon.discount_value, v_calc_subtotal);
    END IF;

    IF p_discount_egp IS NOT NULL AND p_discount_egp <> v_calc_discount THEN
      RAISE EXCEPTION 'pricing_mismatch: discount % does not match authoritative database discount %',
        p_discount_egp, v_calc_discount;
    END IF;

    -- Increment coupon usage atomically
    UPDATE public.coupons
    SET used_count = used_count + 1,
        updated_at = v_now
    WHERE id = v_coupon.id;
  END IF;

  -- 4. Revalidate delivery fee & calculate total
  IF p_delivery_fee_egp < 0 OR p_delivery_fee_egp > 10000 THEN
    RAISE EXCEPTION 'invalid_delivery_fee: delivery fee out of valid bounds';
  END IF;

  v_calc_total := GREATEST(0, v_calc_subtotal - v_calc_discount + p_delivery_fee_egp);

  IF p_total_egp IS NOT NULL AND p_total_egp <> v_calc_total THEN
    RAISE EXCEPTION 'pricing_mismatch: total % does not match authoritative database total %',
      p_total_egp, v_calc_total;
  END IF;

  -- 5. Insert Order Record with Authoritative Values & Fingerprint
  INSERT INTO public.orders (
    id,
    order_number,
    idempotency_key,
    request_fingerprint,
    created_at,
    updated_at,
    customer_full_name,
    customer_mobile,
    customer_normalized_mobile,
    governorate_code,
    governorate_name_snapshot,
    city_or_area,
    street_and_building,
    landmark,
    delivery_note,
    items_snapshot,
    subtotal_egp,
    delivery_fee_egp,
    discount_egp,
    total_egp,
    payment_method,
    payment_status,
    payment_transfer_reference,
    coupon_code,
    coupon_title_snapshot,
    order_status,
    shipment_status,
    customer_lookup_token,
    lookup_hash
  ) VALUES (
    p_order_id,
    p_order_number,
    p_idempotency_key,
    p_request_fingerprint,
    v_now,
    v_now,
    p_customer_full_name,
    p_customer_mobile,
    p_customer_normalized_mobile,
    p_governorate_code,
    p_governorate_name_snapshot,
    p_city_or_area,
    p_street_and_building,
    p_landmark,
    p_delivery_note,
    p_items_snapshot,
    v_calc_subtotal,
    p_delivery_fee_egp,
    v_calc_discount,
    v_calc_total,
    p_payment_method,
    p_payment_status,
    p_payment_transfer_reference,
    p_coupon_code,
    p_coupon_title_snapshot,
    'new',
    'not_yet_prepared',
    p_customer_lookup_token,
    p_lookup_hash
  );

  -- 6. Insert initial status history record
  INSERT INTO public.order_status_history (
    id,
    order_id,
    created_at,
    domain,
    from_status,
    to_status,
    actor,
    actor_identity,
    customer_visible_note,
    internal_admin_note
  ) VALUES (
    'hist-' || p_order_id || '-init',
    p_order_id,
    v_now,
    'order',
    NULL,
    'new',
    'customer',
    'customer_checkout',
    jsonb_build_object(
      'ar', 'تم استلام طلبك بنجاح وجارٍ مراجعته.',
      'en', 'Your order was received successfully and is awaiting review.'
    ),
    'Order created via server atomic checkout transaction.'
  );

  -- 7. Return safe result
  RETURN jsonb_build_object(
    'id', p_order_id,
    'order_number', p_order_number,
    'customer_lookup_token', p_customer_lookup_token,
    'subtotal_egp', v_calc_subtotal,
    'delivery_fee_egp', p_delivery_fee_egp,
    'discount_egp', v_calc_discount,
    'total_egp', v_calc_total,
    'order_status', 'new',
    'payment_status', p_payment_status,
    'created_at', v_now,
    'is_idempotent_replay', false
  );
END;
$$;

-- 6. Privileges Hardening: Lock Down Execution of SECURITY DEFINER Function
-- Explicitly revoke execution from PUBLIC, anon, and authenticated to prevent unauthorized direct invocations.
REVOKE ALL ON FUNCTION public.create_order_atomic(
  text, text, text, text, text, text, text, jsonb, text, text, text, text, jsonb, integer, integer, integer, integer, text, text, text, text, jsonb, text, text, jsonb, text
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.create_order_atomic(
  text, text, text, text, text, text, text, jsonb, text, text, text, text, jsonb, integer, integer, integer, integer, text, text, text, text, jsonb, text, text, jsonb, text
) FROM anon;

REVOKE ALL ON FUNCTION public.create_order_atomic(
  text, text, text, text, text, text, text, jsonb, text, text, text, text, jsonb, integer, integer, integer, integer, text, text, text, text, jsonb, text, text, jsonb, text
) FROM authenticated;

-- Grant execution ONLY to the trusted server-side service role
GRANT EXECUTE ON FUNCTION public.create_order_atomic(
  text, text, text, text, text, text, text, jsonb, text, text, text, text, jsonb, integer, integer, integer, integer, text, text, text, text, jsonb, text, text, jsonb, text
) TO service_role;
