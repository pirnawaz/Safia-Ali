-- ============================================
-- TRANSACTIONAL INVENTORY OPERATIONS
-- ============================================
-- This migration creates database functions to ensure inventory operations
-- are atomic and prevent race conditions

-- Function to issue inventory in a transaction
CREATE OR REPLACE FUNCTION issue_inventory_transaction(
  p_inventory_item_id UUID,
  p_location_id UUID,
  p_quantity DECIMAL,
  p_job_card_id UUID,
  p_cost DECIMAL,
  p_user_id UUID,
  p_notes TEXT,
  p_is_override BOOLEAN
)
RETURNS JSON AS $$
DECLARE
  v_stock_level RECORD;
  v_movement_id UUID;
BEGIN
  -- Lock the stock level row for update to prevent race conditions
  SELECT * INTO v_stock_level
  FROM stock_levels
  WHERE inventory_item_id = p_inventory_item_id
    AND location_id = p_location_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock level not found';
  END IF;

  -- Check if sufficient stock (already validated in API, but double-check)
  IF v_stock_level.quantity < p_quantity AND NOT p_is_override THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', 
      v_stock_level.quantity, p_quantity;
  END IF;

  -- Update stock level
  UPDATE stock_levels
  SET 
    quantity = quantity - p_quantity,
    updated_at = NOW()
  WHERE inventory_item_id = p_inventory_item_id
    AND location_id = p_location_id;

  -- Handle reservation release if job card provided
  IF p_job_card_id IS NOT NULL THEN
    -- Release reservations
    UPDATE inventory_reservations
    SET released_at = NOW()
    WHERE job_card_id = p_job_card_id
      AND inventory_item_id = p_inventory_item_id
      AND released_at IS NULL;

    -- Update reserved quantity
    UPDATE stock_levels
    SET reserved_quantity = GREATEST(0, reserved_quantity - p_quantity)
    WHERE inventory_item_id = p_inventory_item_id
      AND location_id = p_location_id;
  END IF;

  -- Create stock movement
  INSERT INTO stock_movements (
    type,
    inventory_item_id,
    location_id,
    quantity,
    cost,
    reference_id,
    user_id,
    notes
  ) VALUES (
    'issue',
    p_inventory_item_id,
    p_location_id,
    -p_quantity,
    p_cost,
    p_job_card_id,
    p_user_id,
    p_notes
  ) RETURNING id INTO v_movement_id;

  -- Log audit if override
  IF p_is_override THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      action,
      old_values,
      new_values,
      user_id
    ) VALUES (
      'stock_levels',
      v_stock_level.id,
      'update',
      jsonb_build_object('quantity', v_stock_level.quantity),
      jsonb_build_object('quantity', v_stock_level.quantity - p_quantity, 'override', true),
      p_user_id
    );
  END IF;

  -- Return success with movement ID
  RETURN json_build_object(
    'success', true,
    'movement_id', v_movement_id,
    'new_quantity', v_stock_level.quantity - p_quantity
  );
END;
$$ LANGUAGE plpgsql;

-- Function to receive inventory (GRN) in a transaction
CREATE OR REPLACE FUNCTION receive_inventory_transaction(
  p_inventory_item_id UUID,
  p_location_id UUID,
  p_quantity DECIMAL,
  p_cost DECIMAL,
  p_user_id UUID,
  p_notes TEXT,
  p_supplier_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_stock_level RECORD;
  v_movement_id UUID;
  v_old_weighted_avg DECIMAL;
  v_new_weighted_avg DECIMAL;
  v_old_quantity DECIMAL;
BEGIN
  -- Lock the stock level row for update
  SELECT * INTO v_stock_level
  FROM stock_levels
  WHERE inventory_item_id = p_inventory_item_id
    AND location_id = p_location_id
  FOR UPDATE;

  -- If stock level doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO stock_levels (
      inventory_item_id,
      location_id,
      quantity,
      reserved_quantity
    ) VALUES (
      p_inventory_item_id,
      p_location_id,
      p_quantity,
      0
    ) RETURNING * INTO v_stock_level;
    
    v_old_quantity := 0;
  ELSE
    v_old_quantity := v_stock_level.quantity;
    
    -- Update stock level
    UPDATE stock_levels
    SET 
      quantity = quantity + p_quantity,
      updated_at = NOW()
    WHERE inventory_item_id = p_inventory_item_id
      AND location_id = p_location_id;
  END IF;

  -- Calculate new weighted average cost
  SELECT weighted_avg_cost INTO v_old_weighted_avg
  FROM inventory_items
  WHERE id = p_inventory_item_id;

  v_new_weighted_avg := (
    (v_old_weighted_avg * v_old_quantity) + (p_cost * p_quantity)
  ) / (v_old_quantity + p_quantity);

  -- Update weighted average cost
  UPDATE inventory_items
  SET 
    weighted_avg_cost = v_new_weighted_avg,
    updated_at = NOW()
  WHERE id = p_inventory_item_id;

  -- Create stock movement
  INSERT INTO stock_movements (
    type,
    inventory_item_id,
    location_id,
    quantity,
    cost,
    user_id,
    notes
  ) VALUES (
    'grn',
    p_inventory_item_id,
    p_location_id,
    p_quantity,
    p_cost,
    p_user_id,
    p_notes
  ) RETURNING id INTO v_movement_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'movement_id', v_movement_id,
    'new_quantity', v_old_quantity + p_quantity,
    'new_weighted_avg_cost', v_new_weighted_avg
  );
END;
$$ LANGUAGE plpgsql;

-- Function to transfer inventory between locations in a transaction
CREATE OR REPLACE FUNCTION transfer_inventory_transaction(
  p_inventory_item_id UUID,
  p_from_location_id UUID,
  p_to_location_id UUID,
  p_quantity DECIMAL,
  p_user_id UUID,
  p_notes TEXT
)
RETURNS JSON AS $$
DECLARE
  v_from_stock RECORD;
  v_to_stock RECORD;
  v_cost DECIMAL;
  v_movement_id_from UUID;
  v_movement_id_to UUID;
BEGIN
  -- Lock both stock level rows
  SELECT * INTO v_from_stock
  FROM stock_levels
  WHERE inventory_item_id = p_inventory_item_id
    AND location_id = p_from_location_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source stock level not found';
  END IF;

  IF v_from_stock.quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock at source location. Available: %, Requested: %',
      v_from_stock.quantity, p_quantity;
  END IF;

  -- Get weighted average cost
  SELECT weighted_avg_cost INTO v_cost
  FROM inventory_items
  WHERE id = p_inventory_item_id;

  -- Decrease from source location
  UPDATE stock_levels
  SET 
    quantity = quantity - p_quantity,
    updated_at = NOW()
  WHERE inventory_item_id = p_inventory_item_id
    AND location_id = p_from_location_id;

  -- Create outgoing movement
  INSERT INTO stock_movements (
    type,
    inventory_item_id,
    location_id,
    quantity,
    cost,
    user_id,
    notes
  ) VALUES (
    'transfer',
    p_inventory_item_id,
    p_from_location_id,
    -p_quantity,
    v_cost,
    p_user_id,
    'Transfer OUT: ' || COALESCE(p_notes, '')
  ) RETURNING id INTO v_movement_id_from;

  -- Check if destination stock level exists
  SELECT * INTO v_to_stock
  FROM stock_levels
  WHERE inventory_item_id = p_inventory_item_id
    AND location_id = p_to_location_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Create destination stock level
    INSERT INTO stock_levels (
      inventory_item_id,
      location_id,
      quantity,
      reserved_quantity
    ) VALUES (
      p_inventory_item_id,
      p_to_location_id,
      p_quantity,
      0
    );
  ELSE
    -- Increase at destination location
    UPDATE stock_levels
    SET 
      quantity = quantity + p_quantity,
      updated_at = NOW()
    WHERE inventory_item_id = p_inventory_item_id
      AND location_id = p_to_location_id;
  END IF;

  -- Create incoming movement
  INSERT INTO stock_movements (
    type,
    inventory_item_id,
    location_id,
    quantity,
    cost,
    user_id,
    notes
  ) VALUES (
    'transfer',
    p_inventory_item_id,
    p_to_location_id,
    p_quantity,
    v_cost,
    p_user_id,
    'Transfer IN: ' || COALESCE(p_notes, '')
  ) RETURNING id INTO v_movement_id_to;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'movement_id_from', v_movement_id_from,
    'movement_id_to', v_movement_id_to
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION issue_inventory_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION receive_inventory_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_inventory_transaction TO authenticated;

-- Comments
COMMENT ON FUNCTION issue_inventory_transaction IS 
  'Atomically issues inventory, updates stock levels, releases reservations, and logs movements. Prevents race conditions.';

COMMENT ON FUNCTION receive_inventory_transaction IS 
  'Atomically receives inventory (GRN), updates stock levels, recalculates weighted average cost, and logs movements.';

COMMENT ON FUNCTION transfer_inventory_transaction IS 
  'Atomically transfers inventory between locations with proper locking to prevent race conditions.';

