-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_labour_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_design_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_bom_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_labour_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_customisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_sku_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT ur.name
  FROM user_profiles up
  JOIN user_roles ur ON up.role_id = ur.id
  WHERE up.id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles up
    JOIN user_role_permissions urp ON up.role_id = urp.role_id
    JOIN permissions p ON urp.permission_id = p.id
    WHERE up.id = user_id AND p.name = permission_name
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user can view cost prices
CREATE OR REPLACE FUNCTION can_view_cost_price(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT has_permission(user_id, 'view_cost_price') OR 
         get_user_role(user_id) IN ('admin', 'manager', 'accounts');
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- USER PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- MASTER DATA POLICIES
-- ============================================

-- Locations: All authenticated users can read, admins/managers can modify
CREATE POLICY "All users can view locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage locations"
  ON locations FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Suppliers: All authenticated users can read, admins/managers can modify
CREATE POLICY "All users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Taxes: All authenticated users can read, admins/managers can modify
CREATE POLICY "All users can view taxes"
  ON taxes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage taxes"
  ON taxes FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Customers: All authenticated users can read and create, admins/managers can modify
CREATE POLICY "All users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and managers can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Inventory Items: All authenticated users can read, admins/managers can modify
CREATE POLICY "All users can view inventory items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage inventory items"
  ON inventory_items FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Designs: All authenticated users can read, cost price visibility controlled
CREATE POLICY "All users can view designs"
  ON designs FOR SELECT
  TO authenticated
  USING (true);

-- Cost price visibility: Only admin/manager/accounts can see base_cost_price
-- This is handled in application logic, but we can also use a view

CREATE POLICY "Admins and managers can manage designs"
  ON designs FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Design BOM: All authenticated users can read, admins/managers can modify
CREATE POLICY "All users can view design BOM"
  ON design_bom FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage design BOM"
  ON design_bom FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Design Labour Costs: All authenticated users can read, admins/managers can modify
CREATE POLICY "All users can view design labour costs"
  ON design_labour_costs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage design labour costs"
  ON design_labour_costs FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- ============================================
-- INVENTORY POLICIES
-- ============================================

-- Stock Levels: All authenticated users can read
CREATE POLICY "All users can view stock levels"
  ON stock_levels FOR SELECT
  TO authenticated
  USING (true);

-- Stock Movements: All authenticated users can read, admins/managers/staff can create
CREATE POLICY "All users can view stock movements"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can create stock movements"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager', 'staff'));

-- Inventory Reservations: All authenticated users can read
CREATE POLICY "All users can view inventory reservations"
  ON inventory_reservations FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- SALES POLICIES
-- ============================================

-- Sales Orders: All authenticated users can read and create
CREATE POLICY "All users can view sales orders"
  ON sales_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can create sales orders"
  ON sales_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and managers can update sales orders"
  ON sales_orders FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Sales Order Items: All authenticated users can read and create
CREATE POLICY "All users can view sales order items"
  ON sales_order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can create sales order items"
  ON sales_order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and managers can update sales order items"
  ON sales_order_items FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Payments: All authenticated users can read and create
CREATE POLICY "All users can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Invoices: All authenticated users can read
CREATE POLICY "All users can view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

-- Receipts: All authenticated users can read
CREATE POLICY "All users can view receipts"
  ON receipts FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- PRODUCTION POLICIES
-- ============================================

-- Job Cards: All authenticated users can read and create
CREATE POLICY "All users can view job cards"
  ON job_cards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can create job cards"
  ON job_cards FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update job cards"
  ON job_cards FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager', 'staff'));

-- Job Card Stage History: All authenticated users can read
CREATE POLICY "All users can view job card stage history"
  ON job_card_stage_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can create job card stage history"
  ON job_card_stage_history FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager', 'staff'));

-- Job Card Snapshots: All authenticated users can read, system creates
CREATE POLICY "All users can view job card snapshots"
  ON job_card_design_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can view BOM snapshots"
  ON job_card_bom_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can view labour snapshots"
  ON job_card_labour_snapshots FOR SELECT
  TO authenticated
  USING (true);

-- Job Card Customisations: All authenticated users can read
CREATE POLICY "All users can view job card customisations"
  ON job_card_customisations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can create job card customisations"
  ON job_card_customisations FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager', 'staff'));

-- ============================================
-- ALTERATIONS POLICIES
-- ============================================

-- Alterations: All authenticated users can read and create
CREATE POLICY "All users can view alterations"
  ON alterations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can create alterations"
  ON alterations FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager', 'staff'));

-- ============================================
-- SHOPIFY POLICIES
-- ============================================

-- Shopify Settings: Only admins can view and modify
CREATE POLICY "Admins can view shopify settings"
  ON shopify_settings FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can manage shopify settings"
  ON shopify_settings FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- Shopify SKU Mappings: All authenticated users can read, admins can modify
CREATE POLICY "All users can view shopify mappings"
  ON shopify_sku_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage shopify mappings"
  ON shopify_sku_mappings FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- Shopify Sync Logs: All authenticated users can read
CREATE POLICY "All users can view shopify sync logs"
  ON shopify_sync_logs FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- ACCOUNTING POLICIES
-- ============================================

-- Ledger Entries: Admins, managers, and accounts can view
CREATE POLICY "Authorized users can view ledger entries"
  ON ledger_entries FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager', 'accounts'));

-- ============================================
-- AUDIT POLICIES
-- ============================================

-- Audit Logs: All authenticated users can read (read-only)
CREATE POLICY "All users can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);

-- Only system can insert audit logs (via service role)

-- ============================================
-- SYSTEM SETTINGS POLICIES
-- ============================================

-- System Settings: All authenticated users can read, only admins can modify
CREATE POLICY "All users can view system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage system settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

