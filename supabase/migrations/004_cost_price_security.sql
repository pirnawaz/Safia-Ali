-- ============================================
-- COST PRICE SECURITY HARDENING
-- ============================================
-- This migration creates a public view for designs that excludes cost-sensitive fields
-- and updates RLS policies to enforce cost price visibility restrictions.

-- Create a public view of designs without cost fields
CREATE OR REPLACE VIEW designs_public AS
SELECT 
  id,
  name,
  sku,
  category,
  size_range,
  base_selling_price,
  active,
  images,
  created_at,
  updated_at
FROM designs;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON designs_public TO authenticated;

-- Create a similar view for design_bom without cost references
CREATE OR REPLACE VIEW design_bom_public AS
SELECT 
  id,
  design_id,
  inventory_item_id,
  quantity,
  uom,
  created_at,
  updated_at
FROM design_bom;

-- Grant SELECT on the BOM view to authenticated users
GRANT SELECT ON design_bom_public TO authenticated;

-- Create a view for design_labour_costs without actual cost values
CREATE OR REPLACE VIEW design_labour_public AS
SELECT 
  id,
  design_id,
  embroidery_type,
  created_at,
  updated_at
FROM design_labour_costs;

-- Grant SELECT on the labour view to authenticated users
GRANT SELECT ON design_labour_public TO authenticated;

-- ============================================
-- UPDATE RLS POLICIES FOR DESIGNS TABLE
-- ============================================

-- Drop the existing "All users can view designs" policy
DROP POLICY IF EXISTS "All users can view designs" ON designs;

-- Create new restrictive policy: Only authorized roles can view full designs (including costs)
CREATE POLICY "Authorized roles can view designs with costs"
  ON designs FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('admin', 'manager', 'accounts')
  );

-- ============================================
-- UPDATE RLS POLICIES FOR DESIGN BOM
-- ============================================

-- Drop the existing "All users can view design BOM" policy
DROP POLICY IF EXISTS "All users can view design BOM" ON design_bom;

-- Create new restrictive policy: Only authorized roles can view full BOM (including costs)
CREATE POLICY "Authorized roles can view design BOM with costs"
  ON design_bom FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('admin', 'manager', 'accounts')
  );

-- ============================================
-- UPDATE RLS POLICIES FOR DESIGN LABOUR COSTS
-- ============================================

-- Drop the existing "All users can view design labour costs" policy
DROP POLICY IF EXISTS "All users can view design labour costs" ON design_labour_costs;

-- Create new restrictive policy: Only authorized roles can view labour costs
CREATE POLICY "Authorized roles can view design labour costs"
  ON design_labour_costs FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('admin', 'manager', 'accounts')
  );

-- ============================================
-- INVENTORY ITEMS - RESTRICT WEIGHTED AVG COST
-- ============================================

-- Create a public view for inventory items without cost
CREATE OR REPLACE VIEW inventory_items_public AS
SELECT 
  id,
  sku,
  name,
  category,
  uom,
  reorder_level,
  active,
  created_at,
  updated_at
FROM inventory_items;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON inventory_items_public TO authenticated;

-- Drop the existing "All users can view inventory items" policy
DROP POLICY IF EXISTS "All users can view inventory items" ON inventory_items;

-- Create new restrictive policy: Only authorized roles can view inventory with costs
CREATE POLICY "Authorized roles can view inventory items with costs"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('admin', 'manager', 'accounts')
  );

-- ============================================
-- STOCK MOVEMENTS - RESTRICT COST VISIBILITY
-- ============================================

-- Create a public view for stock movements without cost
CREATE OR REPLACE VIEW stock_movements_public AS
SELECT 
  id,
  type,
  inventory_item_id,
  location_id,
  quantity,
  reference_id,
  user_id,
  timestamp,
  notes
FROM stock_movements;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON stock_movements_public TO authenticated;

-- Drop the existing "All users can view stock movements" policy
DROP POLICY IF EXISTS "All users can view stock movements" ON stock_movements;

-- Create new restrictive policy: Only authorized roles can view movements with costs
CREATE POLICY "Authorized roles can view stock movements with costs"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('admin', 'manager', 'accounts')
  );

-- ============================================
-- JOB CARDS - RESTRICT COST VISIBILITY
-- ============================================

-- Create a public view for job cards without cost fields
CREATE OR REPLACE VIEW job_cards_public AS
SELECT 
  id,
  job_number,
  sales_order_item_id,
  customer_id,
  design_id,
  current_stage,
  priority,
  due_date,
  status,
  created_at,
  updated_at
FROM job_cards;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON job_cards_public TO authenticated;

-- Note: We keep the existing RLS policy for job_cards as it already allows all users to read
-- The application layer will use job_cards_public for non-authorized users

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON VIEW designs_public IS 'Public view of designs without cost-sensitive fields. Use this view for POS and production staff.';
COMMENT ON VIEW design_bom_public IS 'Public view of design BOM without cost references. Use this view for POS and production staff.';
COMMENT ON VIEW design_labour_public IS 'Public view of design labour without cost values. Use this view for POS and production staff.';
COMMENT ON VIEW inventory_items_public IS 'Public view of inventory items without weighted average cost. Use this view for POS and production staff.';
COMMENT ON VIEW stock_movements_public IS 'Public view of stock movements without cost data. Use this view for POS and production staff.';
COMMENT ON VIEW job_cards_public IS 'Public view of job cards without cost fields. Use this view for POS and production staff.';

