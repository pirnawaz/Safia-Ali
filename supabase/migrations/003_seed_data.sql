-- ============================================
-- SEED DATA
-- ============================================

-- Insert User Roles
INSERT INTO user_roles (name, description) VALUES
  ('admin', 'Full system access'),
  ('manager', 'Management access with cost visibility'),
  ('accounts', 'Accounting and financial access'),
  ('staff', 'Production and operations staff'),
  ('pos_operator', 'Point of sale operator')
ON CONFLICT (name) DO NOTHING;

-- Insert Permissions
INSERT INTO permissions (name, description) VALUES
  ('view_cost_price', 'View cost prices and cost breakdowns'),
  ('edit_pricing', 'Edit selling prices and discounts'),
  ('override_inventory', 'Override inventory availability checks'),
  ('manage_users', 'Create and manage user accounts'),
  ('view_reports', 'Access reporting and analytics'),
  ('manage_settings', 'Modify system settings')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Admin gets all permissions
INSERT INTO user_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM user_roles WHERE name = 'admin'),
  id
FROM permissions
ON CONFLICT DO NOTHING;

-- Manager gets most permissions except user management
INSERT INTO user_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM user_roles WHERE name = 'manager'),
  id
FROM permissions
WHERE name IN ('view_cost_price', 'edit_pricing', 'override_inventory', 'view_reports')
ON CONFLICT DO NOTHING;

-- Accounts gets financial permissions
INSERT INTO user_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM user_roles WHERE name = 'accounts'),
  id
FROM permissions
WHERE name IN ('view_cost_price', 'view_reports')
ON CONFLICT DO NOTHING;

-- Insert Locations
INSERT INTO locations (name, type, address) VALUES
  ('Main Store', 'store', '123 Fashion Street, City'),
  ('Workshop', 'workshop', '456 Production Lane, City')
ON CONFLICT (name) DO NOTHING;

-- Insert Tax
INSERT INTO taxes (name, rate, inclusive, active) VALUES
  ('VAT', 18.00, false, true)
ON CONFLICT DO NOTHING;

-- Insert System Settings
INSERT INTO system_settings (key, value) VALUES
  ('app_name', 'Safia Ali')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Insert Sample Suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES
  ('Fabric Supplier A', 'John Doe', '+1234567890', 'john@fabric-supplier.com', '789 Supplier St'),
  ('Thread Supplier B', 'Jane Smith', '+0987654321', 'jane@thread-supplier.com', '321 Thread Ave')
ON CONFLICT DO NOTHING;

-- Insert Sample Inventory Items
INSERT INTO inventory_items (sku, name, category, uom, reorder_level, weighted_avg_cost, active) VALUES
  ('FAB-001', 'Silk Fabric - Premium', 'Fabric', 'meters', 50.00, 150.00, true),
  ('FAB-002', 'Cotton Fabric - Standard', 'Fabric', 'meters', 100.00, 80.00, true),
  ('THR-001', 'Embroidery Thread - Gold', 'Thread', 'spools', 20.00, 25.00, true),
  ('THR-002', 'Sewing Thread - White', 'Thread', 'spools', 30.00, 15.00, true),
  ('BEAD-001', 'Pearl Beads', 'Beads', 'pieces', 1000.00, 0.50, true),
  ('ZIP-001', 'Zipper - Standard', 'Zippers', 'pieces', 50.00, 10.00, true),
  ('LIN-001', 'Lining Fabric', 'Fabric', 'meters', 75.00, 60.00, true)
ON CONFLICT (sku) DO NOTHING;

-- Insert Sample Designs
INSERT INTO designs (name, sku, category, size_range, base_selling_price, base_cost_price, active) VALUES
  ('Luxury Evening Gown', 'DES-001', 'Evening Wear', 'XS-XXL', 5000.00, 2000.00, true),
  ('Bridal Lehenga', 'DES-002', 'Bridal', 'Custom', 15000.00, 6000.00, true),
  ('Designer Saree', 'DES-003', 'Traditional', 'One Size', 3000.00, 1200.00, true),
  ('Embroidered Kurta', 'DES-004', 'Casual', 'S-XXL', 2500.00, 1000.00, true)
ON CONFLICT (sku) DO NOTHING;

-- Insert Design BOM for DES-001
INSERT INTO design_bom (design_id, inventory_item_id, quantity, uom, unit_cost_reference)
SELECT 
  (SELECT id FROM designs WHERE sku = 'DES-001'),
  (SELECT id FROM inventory_items WHERE sku = 'FAB-001'),
  3.5,
  'meters',
  150.00
ON CONFLICT DO NOTHING;

INSERT INTO design_bom (design_id, inventory_item_id, quantity, uom, unit_cost_reference)
SELECT 
  (SELECT id FROM designs WHERE sku = 'DES-001'),
  (SELECT id FROM inventory_items WHERE sku = 'THR-001'),
  2.0,
  'spools',
  25.00
ON CONFLICT DO NOTHING;

INSERT INTO design_bom (design_id, inventory_item_id, quantity, uom, unit_cost_reference)
SELECT 
  (SELECT id FROM designs WHERE sku = 'DES-001'),
  (SELECT id FROM inventory_items WHERE sku = 'ZIP-001'),
  1.0,
  'pieces',
  10.00
ON CONFLICT DO NOTHING;

-- Insert Design Labour Costs
INSERT INTO design_labour_costs (design_id, cutting_cost, embroidery_type, embroidery_cost, stitching_cost, finishing_cost)
SELECT 
  (SELECT id FROM designs WHERE sku = 'DES-001'),
  200.00,
  'hand',
  800.00,
  500.00,
  300.00
ON CONFLICT (design_id) DO NOTHING;

-- Insert Sample Customers
INSERT INTO customers (name, phone, email, address, notes) VALUES
  ('Sarah Ahmed', '+1234567890', 'sarah@example.com', '123 Customer St', 'VIP Customer'),
  ('Fatima Khan', '+0987654321', 'fatima@example.com', '456 Client Ave', 'Regular customer'),
  ('Ayesha Ali', '+1122334455', 'ayesha@example.com', '789 Buyer Rd', 'New customer')
ON CONFLICT DO NOTHING;

-- Initialize stock levels for Main Store
INSERT INTO stock_levels (inventory_item_id, location_id, quantity, reserved_quantity)
SELECT 
  ii.id,
  (SELECT id FROM locations WHERE name = 'Main Store'),
  CASE 
    WHEN ii.sku = 'FAB-001' THEN 200.00
    WHEN ii.sku = 'FAB-002' THEN 300.00
    WHEN ii.sku = 'THR-001' THEN 50.00
    WHEN ii.sku = 'THR-002' THEN 100.00
    WHEN ii.sku = 'BEAD-001' THEN 5000.00
    WHEN ii.sku = 'ZIP-001' THEN 200.00
    WHEN ii.sku = 'LIN-001' THEN 150.00
    ELSE 0.00
  END,
  0.00
FROM inventory_items ii
ON CONFLICT (inventory_item_id, location_id) DO NOTHING;

-- Initialize stock levels for Workshop
INSERT INTO stock_levels (inventory_item_id, location_id, quantity, reserved_quantity)
SELECT 
  ii.id,
  (SELECT id FROM locations WHERE name = 'Workshop'),
  CASE 
    WHEN ii.sku = 'FAB-001' THEN 100.00
    WHEN ii.sku = 'FAB-002' THEN 150.00
    WHEN ii.sku = 'THR-001' THEN 25.00
    WHEN ii.sku = 'THR-002' THEN 50.00
    WHEN ii.sku = 'BEAD-001' THEN 2000.00
    WHEN ii.sku = 'ZIP-001' THEN 100.00
    WHEN ii.sku = 'LIN-001' THEN 75.00
    ELSE 0.00
  END,
  0.00
FROM inventory_items ii
ON CONFLICT (inventory_item_id, location_id) DO NOTHING;

