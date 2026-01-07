-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS on all tables by default
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- ============================================
-- AUTH & USERS
-- ============================================

-- User roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User role permissions junction
CREATE TABLE user_role_permissions (
  role_id UUID REFERENCES user_roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User profiles (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES user_roles(id),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MASTER DATA
-- ============================================

-- Locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('store', 'workshop')),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Taxes
CREATE TABLE taxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  inclusive BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  measurements JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Items
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  uom TEXT NOT NULL, -- Unit of Measure (meters, pieces, kg, etc.)
  reorder_level DECIMAL(10,2) DEFAULT 0,
  weighted_avg_cost DECIMAL(10,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Designs (Products)
CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category TEXT,
  size_range TEXT, -- e.g., "XS-XXL" or "Custom"
  base_selling_price DECIMAL(10,2) NOT NULL CHECK (base_selling_price >= 0),
  base_cost_price DECIMAL(10,2) DEFAULT 0 CHECK (base_cost_price >= 0),
  active BOOLEAN DEFAULT true,
  images JSONB, -- Array of image URLs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Design BOM (Bill of Materials)
CREATE TABLE design_bom (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  uom TEXT NOT NULL,
  unit_cost_reference DECIMAL(10,2), -- Reference cost at time of BOM creation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(design_id, inventory_item_id)
);

-- Design Labour Costs
CREATE TABLE design_labour_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE UNIQUE,
  cutting_cost DECIMAL(10,2) DEFAULT 0 CHECK (cutting_cost >= 0),
  embroidery_type TEXT, -- hand/machine/computer
  embroidery_cost DECIMAL(10,2) DEFAULT 0 CHECK (embroidery_cost >= 0),
  stitching_cost DECIMAL(10,2) DEFAULT 0 CHECK (stitching_cost >= 0),
  finishing_cost DECIMAL(10,2) DEFAULT 0 CHECK (finishing_cost >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVENTORY
-- ============================================

-- Stock Levels
CREATE TABLE stock_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inventory_item_id, location_id)
);

-- Stock Movements
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('grn', 'issue', 'transfer', 'adjustment')),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  reference_id UUID, -- Can reference GRN, job card, etc.
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Inventory Reservations
CREATE TABLE inventory_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id UUID, -- Will reference job_cards table
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

-- ============================================
-- SALES
-- ============================================

-- Sales Orders
CREATE TABLE sales_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_production', 'ready', 'delivered', 'closed')),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Order Items
CREATE TABLE sales_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  size TEXT,
  measurements JSONB,
  custom_notes TEXT,
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  customisation_delta DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
  tax_rate DECIMAL(5,2) DEFAULT 0,
  delivery_date_estimate DATE,
  requires_job_card BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'bank_transfer')),
  reference TEXT,
  receipt_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  pdf_path TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipts
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  pdf_path TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTION
-- ============================================

-- Job Cards
CREATE TABLE job_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_number TEXT NOT NULL UNIQUE,
  sales_order_item_id UUID REFERENCES sales_order_items(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
  current_stage TEXT NOT NULL DEFAULT 'fabric_procurement' CHECK (current_stage IN (
    'fabric_procurement', 'dyeing', 'cutting', 'embroidery', 'stitching', 
    'finishing_qa', 'ready', 'dispatched', 'delivered', 'alteration_requested'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_date DATE,
  estimated_cost DECIMAL(10,2) DEFAULT 0 CHECK (estimated_cost >= 0),
  actual_cost DECIMAL(10,2) DEFAULT 0 CHECK (actual_cost >= 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Card Stage History
CREATE TABLE job_card_stage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Job Card Design Snapshots (immutable)
CREATE TABLE job_card_design_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  design_data JSONB NOT NULL,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Card BOM Snapshots (immutable)
CREATE TABLE job_card_bom_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  bom_data JSONB NOT NULL,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Card Labour Snapshots (immutable)
CREATE TABLE job_card_labour_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  labour_data JSONB NOT NULL,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Card Customisations/Substitutions
CREATE TABLE job_card_customisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('substitution', 'addition')),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  original_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  quantity DECIMAL(10,2),
  cost_delta DECIMAL(10,2) DEFAULT 0,
  reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  requires_price_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ALTERATIONS
-- ============================================

-- Alterations
CREATE TABLE alterations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  alteration_job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL CHECK (cycle_number > 0),
  request_notes TEXT,
  request_photos JSONB, -- Array of photo URLs
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  requested_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- SHOPIFY
-- ============================================

-- Shopify Settings
CREATE TABLE shopify_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_url TEXT,
  access_token TEXT,
  webhook_secret TEXT,
  active BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Shopify SKU Mappings
CREATE TABLE shopify_sku_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_sku TEXT NOT NULL,
  shopify_variant_id TEXT,
  internal_design_sku TEXT NOT NULL REFERENCES designs(sku) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shopify_sku, shopify_variant_id)
);

-- Shopify Sync Logs
CREATE TABLE shopify_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('customers', 'orders')),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  records_processed INTEGER DEFAULT 0,
  errors JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  synced_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- ACCOUNTING
-- ============================================

-- Ledger Entries
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('sale', 'payment', 'tax')),
  reference_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  debit_account TEXT,
  credit_account TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT
-- ============================================

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET
);

-- ============================================
-- SYSTEM
-- ============================================

-- System Settings
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- INDEXES
-- ============================================

-- User profiles
CREATE INDEX idx_user_profiles_role ON user_profiles(role_id);

-- Customers
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);

-- Designs
CREATE INDEX idx_designs_sku ON designs(sku);
CREATE INDEX idx_designs_active ON designs(active);

-- Inventory
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_stock_levels_item_location ON stock_levels(inventory_item_id, location_id);
CREATE INDEX idx_stock_movements_item ON stock_movements(inventory_item_id);
CREATE INDEX idx_stock_movements_timestamp ON stock_movements(timestamp);
CREATE INDEX idx_inventory_reservations_job_card ON inventory_reservations(job_card_id);

-- Sales
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_created_at ON sales_orders(created_at);
CREATE INDEX idx_sales_order_items_order ON sales_order_items(sales_order_id);
CREATE INDEX idx_payments_order ON payments(sales_order_id);

-- Production
CREATE INDEX idx_job_cards_customer ON job_cards(customer_id);
CREATE INDEX idx_job_cards_stage ON job_cards(current_stage);
CREATE INDEX idx_job_cards_status ON job_cards(status);
CREATE INDEX idx_job_cards_due_date ON job_cards(due_date);
CREATE INDEX idx_job_card_stage_history_job_card ON job_card_stage_history(job_card_id);
CREATE INDEX idx_job_card_customisations_job_card ON job_card_customisations(job_card_id);

-- Alterations
CREATE INDEX idx_alterations_original ON alterations(original_job_card_id);
CREATE INDEX idx_alterations_alteration ON alterations(alteration_job_card_id);

-- Audit
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

