-- =============================================================================
-- LABSA | لَبسة — PostgreSQL Schema & Privileges Hardening
-- Migration 003: Authoritative Database Checkout, Idempotency Fingerprint & RPC Lockdown
-- =============================================================================

-- 1. Add Request Fingerprint to Orders Table for Replay Binding
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS request_fingerprint text;
CREATE INDEX IF NOT EXISTS idx_orders_request_fingerprint ON public.orders(request_fingerprint);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- 2. Drop Legacy 25-parameter RPC signature (if existing)
DROP FUNCTION IF EXISTS public.create_order_atomic(
  text, text, text, text, text, text, text, jsonb, text, text, text, text, jsonb, integer, integer, integer, integer, text, text, text, text, jsonb, text, text, jsonb
);

-- 3. Create or Replace the Authoritative Atomic Order Handling Function
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
      -- Strict idempotency check: both the stored fingerprint and the incoming request fingerprint
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

-- 4. Privileges Hardening: Lock Down Execution of SECURITY DEFINER Function
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

-- -----------------------------------------------------------------------------
-- 5. Shared Multi-Instance Atomic Rate Limiter Table & Function
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_reset_at ON public.rate_limit_buckets(reset_at);

-- RLS: No public access
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_reset_at timestamptz := v_now + (p_window_seconds || ' seconds')::interval;
  v_count integer;
  v_bucket_reset timestamptz;
  v_allowed boolean;
  v_remaining integer;
  v_reset_in_seconds integer;
BEGIN
  -- Lazy cleanup of expired buckets (1% sample probability per call to prevent table bloat)
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limit_buckets WHERE reset_at < v_now;
  END IF;

  -- Atomic UPSERT: Single atomic SQL statement serializes all concurrent requests
  -- for the same key. Handles both first-use keys and expired keys atomically without
  -- a separate SELECT FOR UPDATE, eliminating the concurrent-reset race condition.
  -- Simultaneous requests can never repeatedly reset the same bucket counter to 1.
  INSERT INTO public.rate_limit_buckets AS b (key, count, reset_at)
  VALUES (p_key, 1, v_reset_at)
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE
      -- If the existing bucket has expired, reset counter to 1 atomically for the first request
      WHEN b.reset_at <= v_now THEN 1
      -- Otherwise, atomically increment the counter
      ELSE b.count + 1
    END,
    reset_at = CASE
      -- If expired, advance reset_at to the new window expiration
      WHEN b.reset_at <= v_now THEN v_reset_at
      -- Otherwise, preserve the existing active bucket expiration
      ELSE b.reset_at
    END
  RETURNING b.count, b.reset_at INTO v_count, v_bucket_reset;

  -- Determine allowance strictly from the returned counter of the atomic upsert
  IF v_count <= p_limit THEN
    v_allowed := true;
    v_remaining := p_limit - v_count;
  ELSE
    v_allowed := false;
    v_remaining := 0;
  END IF;

  v_reset_in_seconds := GREATEST(1, EXTRACT(EPOCH FROM (v_bucket_reset - v_now))::integer);

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', v_remaining,
    'reset_in_seconds', v_reset_in_seconds
  );
END;
$$;

-- Lock down rate limiter execution to trusted server service role only
REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

-- -----------------------------------------------------------------------------
-- 6. Verification Query (Run to verify privilege revocation)
-- -----------------------------------------------------------------------------
-- SELECT
--   p.proname,
--   has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
--   has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can_execute,
--   has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_can_execute
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.proname IN ('create_order_atomic', 'check_rate_limit');
-- Expected: anon = false, authenticated = false, service_role = true.
