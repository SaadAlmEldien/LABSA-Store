-- =============================================================================
-- LABSA | لَبسة — PostgreSQL Schema & Row-Level Security (RLS) Policies
-- Stage 7: Admin Access Control, Catalog & Order Protection
-- =============================================================================

-- 1. Helper Function: Check if the authenticated Supabase user has the 'admin' role
-- Note: Public admin registration is disabled. Admin role is assigned exclusively
-- via server-side app_metadata in Supabase Auth.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  audience text NOT NULL CHECK (audience IN ('men', 'kids')),
  category text NOT NULL CHECK (category IN ('trousers', 'shirts', 'tshirts', 'sweatshirts', 'jackets')),
  title_ar text NOT NULL,
  title_en text NOT NULL,
  short_description_ar text NOT NULL,
  short_description_en text NOT NULL,
  description_ar text NOT NULL,
  description_en text NOT NULL,
  price_egp integer NOT NULL CHECK (price_egp > 0),
  previous_price_egp integer CHECK (previous_price_egp IS NULL OR previous_price_egp > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'out_of_stock', 'draft')),
  is_new boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  featured_rank integer NOT NULL DEFAULT 99,
  colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Product Variants Table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  sku text UNIQUE NOT NULL,
  color_key text NOT NULL,
  size text NOT NULL,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Orders Table (Immutable Order-Time Item & Delivery Snapshots)
CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  order_number text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  customer_full_name text NOT NULL,
  customer_mobile text NOT NULL,
  customer_normalized_mobile text NOT NULL,
  governorate_code text NOT NULL,
  governorate_name_snapshot jsonb NOT NULL,
  city_or_area text NOT NULL,
  street_and_building text NOT NULL,
  landmark text,
  delivery_note text,
  items_snapshot jsonb NOT NULL,
  subtotal_egp integer NOT NULL CHECK (subtotal_egp >= 0),
  delivery_fee_egp integer NOT NULL CHECK (delivery_fee_egp >= 0),
  total_egp integer NOT NULL CHECK (total_egp >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('cod', 'manual_wallet', 'manual_instapay')),
  payment_transfer_reference text,
  order_status text NOT NULL DEFAULT 'new' CHECK (
    order_status IN ('new', 'awaiting_processing', 'confirmed', 'preparing', 'ready_to_ship', 'completed', 'cancelled')
  ),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (
    payment_status IN ('unpaid', 'awaiting_manual_verification', 'paid', 'verification_failed', 'refunded')
  ),
  shipment_status text NOT NULL DEFAULT 'not_yet_prepared' CHECK (
    shipment_status IN ('not_yet_prepared', 'packing', 'dispatched', 'in_transit', 'delivered', 'delivery_issue', 'returned_to_sender')
  ),
  carrier_name text,
  tracking_number text,
  latest_customer_tracking_update jsonb
);

-- 5. Order Status & Audit History Table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  domain text NOT NULL CHECK (domain IN ('order', 'payment', 'shipment')),
  from_status text,
  to_status text NOT NULL,
  actor text NOT NULL CHECK (actor IN ('customer', 'admin', 'system')),
  actor_identity text,
  customer_visible_note jsonb NOT NULL,
  internal_admin_note text
);

-- =============================================================================
-- ROW-LEVEL SECURITY (RLS) ENFORCEMENT
-- =============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Public visitors can read only active/out_of_stock products (never draft/archived)
CREATE POLICY "Public can view published products"
  ON public.products
  FOR SELECT
  USING (status IN ('active', 'out_of_stock') OR public.is_admin());

-- Only authorized admins can insert/update/archive products
CREATE POLICY "Admins can manage products"
  ON public.products
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Public visitors can read variants of published products
CREATE POLICY "Public can view published variants"
  ON public.product_variants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id
        AND p.status IN ('active', 'out_of_stock')
    )
    OR public.is_admin()
  );

-- Only authorized admins can modify variant inventory directly
CREATE POLICY "Admins can manage product variants"
  ON public.product_variants
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Orders & Order Status History: NO public SELECT policy.
-- Public visitors cannot read or enumerate orders or internal admin notes.
CREATE POLICY "Admins have full access to orders"
  ON public.orders
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to order status history"
  ON public.order_status_history
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- The app accesses Supabase only from trusted server routes using service_role.
-- Keep Data API table grants explicit; do not grant direct browser roles here.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE
  public.products,
  public.product_variants,
  public.orders,
  public.order_status_history
TO service_role;
