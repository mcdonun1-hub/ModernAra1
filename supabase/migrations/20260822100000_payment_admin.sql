-- Payment metadata and administrator access for orders.
-- Set auth.users.app_metadata.role = 'admin' for approved administrators.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_authority text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_ref_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_error text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_authority_unique
  ON orders (payment_authority)
  WHERE payment_authority IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_status_created_at_idx
  ON orders (status, created_at DESC);

-- Customers may only create a pending order. The Edge Functions use the service role
-- after authentication and are responsible for payment state changes.
DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_pending_orders" ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND payment_authority IS NULL
    AND payment_ref_id IS NULL
  );

-- Customers must not be able to mutate order status or payment metadata from the browser.
DROP POLICY IF EXISTS "update_own_orders" ON orders;

DROP POLICY IF EXISTS "admin_select_all_orders" ON orders;
CREATE POLICY "admin_select_all_orders" ON orders FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_select_all_order_items" ON order_items;
CREATE POLICY "admin_select_all_order_items" ON order_items FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

COMMENT ON COLUMN orders.payment_authority IS 'Gateway authority/token returned by ZarinPal; never trust client input.';
COMMENT ON COLUMN orders.payment_ref_id IS 'Gateway reference id after server-side verification.';
