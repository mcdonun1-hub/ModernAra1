-- Full Backoffice support: administrator CRUD for catalogue, content and operations.
-- Run this migration in Supabase before using the production tabs.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage', 'fixed')),
  value numeric(12,2) NOT NULL DEFAULT 0 CHECK (value >= 0),
  min_order numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  max_uses integer CHECK (max_uses IS NULL OR max_uses >= 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  address text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_settings (
  id text PRIMARY KEY DEFAULT 'store',
  store_name text NOT NULL DEFAULT 'مُدارا',
  support_phone text NOT NULL DEFAULT '',
  support_email text NOT NULL DEFAULT '',
  shipping_threshold numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'تومان',
  announcement text NOT NULL DEFAULT '',
  maintenance_mode boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO store_settings (id) VALUES ('store') ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- Content and catalogue management.
DROP POLICY IF EXISTS "admin_manage_categories" ON categories;
CREATE POLICY "admin_manage_categories" ON categories FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_products" ON products;
CREATE POLICY "admin_manage_products" ON products FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_blog_posts" ON blog_posts;
CREATE POLICY "admin_manage_blog_posts" ON blog_posts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_reviews" ON reviews;
CREATE POLICY "admin_manage_reviews" ON reviews FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_coupons" ON coupons;
CREATE POLICY "admin_manage_coupons" ON coupons FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_customer_profiles" ON customer_profiles;
CREATE POLICY "admin_manage_customer_profiles" ON customer_profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_store_settings" ON store_settings;
CREATE POLICY "admin_manage_store_settings" ON store_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "public_read_store_settings" ON store_settings;
CREATE POLICY "public_read_store_settings" ON store_settings FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS coupons_active_expires_idx ON coupons (active, expires_at);
CREATE INDEX IF NOT EXISTS customer_profiles_phone_idx ON customer_profiles (phone);
CREATE INDEX IF NOT EXISTS reviews_status_created_at_idx ON reviews (status, created_at DESC);
