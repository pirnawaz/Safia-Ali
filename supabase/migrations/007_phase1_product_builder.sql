-- ============================================
-- PHASE 1: PRODUCT BUILDER ENHANCEMENTS
-- ============================================
-- This migration updates the schema to support complete Product Builder functionality:
-- - Status field (draft/ready) on designs
-- - Enhanced BOM with wastage and cost override
-- - Labour lines (multiple per design)
-- - Cost audit trail
-- ============================================

-- Add status and cost tracking fields to designs
ALTER TABLE designs 
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS cost_last_computed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Set default and update existing NULL values for status column
UPDATE designs SET status = 'draft' WHERE status IS NULL;
ALTER TABLE designs 
  ALTER COLUMN status SET DEFAULT 'draft',
  ALTER COLUMN status SET NOT NULL;

-- Add check constraint for status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'designs'::regclass 
      AND conname = 'designs_status_check'
  ) THEN
    ALTER TABLE designs ADD CONSTRAINT designs_status_check CHECK (status IN ('draft', 'ready'));
  END IF;
END $$;

-- Update design_bom to support wastage and cost override
ALTER TABLE design_bom
  ADD COLUMN IF NOT EXISTS wastage_pct DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (wastage_pct >= 0),
  ADD COLUMN IF NOT EXISTS cost_override DECIMAL(10,2) CHECK (cost_override >= 0),
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Remove the UNIQUE constraint on (design_id, inventory_item_id) to allow multiple lines
-- This allows the same inventory item to appear multiple times in a BOM
-- (e.g., different quantities for different parts of a garment)
DO $$
DECLARE
  constraint_name TEXT;
  design_id_attnum SMALLINT;
  inventory_item_id_attnum SMALLINT;
BEGIN
  -- Get attribute numbers (as smallint to match conkey type)
  SELECT attnum::SMALLINT INTO design_id_attnum
  FROM pg_attribute
  WHERE attrelid = 'design_bom'::regclass AND attname = 'design_id';
  
  SELECT attnum::SMALLINT INTO inventory_item_id_attnum
  FROM pg_attribute
  WHERE attrelid = 'design_bom'::regclass AND attname = 'inventory_item_id';
  
  -- Find the UNIQUE constraint on (design_id, inventory_item_id)
  -- conkey is smallint[], so we need to cast properly
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'design_bom'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 2
    AND conkey @> ARRAY[design_id_attnum]::smallint[]
    AND conkey @> ARRAY[inventory_item_id_attnum]::smallint[];
  
  -- Drop the constraint if it exists
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE design_bom DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Create design_labour_lines table (replacing design_labour_costs structure)
-- This allows multiple labour steps per design
CREATE TABLE IF NOT EXISTS design_labour_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  labour_type TEXT NOT NULL,
  rate DECIMAL(10,2) NOT NULL CHECK (rate >= 0),
  qty DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (qty > 0),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing design_labour_costs data to design_labour_lines
-- Only if design_labour_costs table exists and has data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'design_labour_costs') THEN
    INSERT INTO design_labour_lines (design_id, labour_type, rate, qty, sort_order, created_at, updated_at)
    SELECT 
      design_id,
      'cutting',
      cutting_cost,
      1,
      1,
      created_at,
      updated_at
    FROM design_labour_costs
    WHERE cutting_cost > 0;

    INSERT INTO design_labour_lines (design_id, labour_type, rate, qty, sort_order, created_at, updated_at)
    SELECT 
      design_id,
      'embroidery',
      embroidery_cost,
      1,
      2,
      created_at,
      updated_at
    FROM design_labour_costs
    WHERE embroidery_cost > 0;

    INSERT INTO design_labour_lines (design_id, labour_type, rate, qty, sort_order, created_at, updated_at)
    SELECT 
      design_id,
      'stitching',
      stitching_cost,
      1,
      3,
      created_at,
      updated_at
    FROM design_labour_costs
    WHERE stitching_cost > 0;

    INSERT INTO design_labour_lines (design_id, labour_type, rate, qty, sort_order, created_at, updated_at)
    SELECT 
      design_id,
      'finishing',
      finishing_cost,
      1,
      4,
      created_at,
      updated_at
    FROM design_labour_costs
    WHERE finishing_cost > 0;
  END IF;
END $$;

-- Create design_cost_audit table for tracking cost computations
CREATE TABLE IF NOT EXISTS design_cost_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  computed_cost DECIMAL(10,2) NOT NULL CHECK (computed_cost >= 0),
  computed_breakdown JSONB NOT NULL,
  saved_by UUID REFERENCES auth.users(id),
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_designs_status ON designs(status);
CREATE INDEX IF NOT EXISTS idx_design_bom_design_id ON design_bom(design_id);
CREATE INDEX IF NOT EXISTS idx_design_labour_lines_design_id ON design_labour_lines(design_id);
CREATE INDEX IF NOT EXISTS idx_design_cost_audit_design_id ON design_cost_audit(design_id);

-- Update RLS policies for new tables
ALTER TABLE design_labour_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_cost_audit ENABLE ROW LEVEL SECURITY;

-- Labour lines: All authenticated users can read, admins/managers can modify
-- Drop policies if they exist (for idempotency)
DROP POLICY IF EXISTS "All users can view design labour lines" ON design_labour_lines;
DROP POLICY IF EXISTS "Admins and managers can manage design labour lines" ON design_labour_lines;

CREATE POLICY "All users can view design labour lines"
  ON design_labour_lines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage design labour lines"
  ON design_labour_lines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid() AND ur.name IN ('admin', 'manager')
    )
  );

-- Cost audit: Only admins/managers/accounts can view
-- Drop policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Authorized roles can view cost audit" ON design_cost_audit;
DROP POLICY IF EXISTS "Admins and managers can insert cost audit" ON design_cost_audit;

CREATE POLICY "Authorized roles can view cost audit"
  ON design_cost_audit FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid() AND ur.name IN ('admin', 'manager', 'accounts')
    )
  );

CREATE POLICY "Admins and managers can insert cost audit"
  ON design_cost_audit FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_roles ur ON up.role_id = ur.id
      WHERE up.id = auth.uid() AND ur.name IN ('admin', 'manager')
    )
  );

-- Update views for POS to only show ready products
CREATE OR REPLACE VIEW designs_ready AS
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
FROM designs
WHERE status = 'ready' AND active = true;

GRANT SELECT ON designs_ready TO authenticated;
