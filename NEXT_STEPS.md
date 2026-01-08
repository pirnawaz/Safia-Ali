# Next Steps - Phase 1 Implementation

## ✅ What's Been Completed

All Phase 0 and Phase 1 implementation is **100% complete**:

- ✅ Phase 0 Foundation (localization, sidebar, navigation, placeholders, roadmap)
- ✅ Phase 1 Backend (APIs, migrations, validation, RBAC)
- ✅ Phase 1 UI (Product Builder, BOM Editor, Labour Editor, Cost Summary)
- ✅ Migration file fixed (UNIQUE constraint removal)

## 🚀 What You Need To Do Next

### Step 1: Apply Database Migration

**If migrations 001-006 are already applied:**
- Apply only: `supabase/migrations/007_phase1_product_builder.sql`

**If starting fresh:**
- Apply all migrations 001-007 in order

#### How to Apply:

1. Go to Supabase Dashboard: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Click **"New Query"**
4. Open `supabase/migrations/007_phase1_product_builder.sql`
5. Copy the entire file contents
6. Paste into SQL Editor
7. Click **"Run"** (or press `Ctrl+Enter`)
8. Verify success (should see "Success. No rows returned")

### Step 2: Verify Migration Success

Run this in SQL Editor to verify:

```sql
-- Check new columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'designs' 
  AND column_name IN ('status', 'cost_last_computed_at', 'created_by');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('design_labour_lines', 'design_cost_audit');

-- Check view exists
SELECT viewname FROM pg_views 
WHERE viewname = 'designs_ready';

-- Verify UNIQUE constraint was removed
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'design_bom'::regclass 
  AND contype = 'u'
  AND array_length(conkey, 1) = 2;
-- Should return 0 rows (constraint removed)
```

### Step 3: Test the Application

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Test Product Builder Workflow:**
   - Navigate to `/designs`
   - Click "New Product"
   - Create a product with:
     - Name: "Test Product"
     - SKU: "TEST-001"
     - Base Selling Price: 5000
   - Click "Create Product"
   - You'll be redirected to the product overview page

3. **Add BOM Lines:**
   - Go to "BOM" tab or click "Manage BOM"
   - Click "Add Line"
   - Select an inventory item
   - Set quantity, unit, wastage %
   - (Optional) Set cost override (if you have cost view permissions)
   - Click "Add Line"
   - Add multiple lines if needed

4. **Add Labour Steps:**
   - Go to "Labour" tab or click "Manage Labour"
   - Click "Add Step"
   - Select labour type (Cutting, Stitching, etc.)
   - Set rate (PKR) and quantity
   - Add notes if needed
   - Click "Add Step"
   - Add multiple steps

5. **Compute and Save Costs:**
   - Go to "Cost" tab or click "View Details"
   - Review the cost breakdown
   - Click "Save Base COGS" (admin/manager only)
   - Verify cost is saved

6. **Mark Product as Ready:**
   - Go back to "Overview" tab
   - Change status dropdown to "Ready"
   - If it's disabled, verify:
     - Base selling price > 0 ✓
     - At least one BOM line OR one labour line exists ✓

7. **Test POS Filtering:**
   - Navigate to `/pos`
   - Verify only "Ready" products are shown
   - Verify no cost fields are visible (as pos_operator)

### Step 4: Test RBAC (Role-Based Access)

1. **As Admin/Manager:**
   - Should see cost fields everywhere
   - Can edit all product fields
   - Can save base COGS

2. **As Accounts:**
   - Should see cost totals but may have restricted BOM line details
   - Can view products and costs

3. **As Staff:**
   - Should NOT see cost fields
   - Can view products but costs hidden

4. **As POS Operator:**
   - Should only see Ready products in POS
   - Should NOT see any cost fields

### Step 5: Check Roadmap

- Navigate to `/roadmap`
- Verify Phase 0 shows "Done"
- Verify Phase 1 shows "In Progress"
- Verify Phase 2-5 show "Coming Soon"
- Click "Open Module" buttons to test navigation

## 🔍 Troubleshooting

### Migration Fails

**Error: "column already exists"**
- The migration uses `IF NOT EXISTS` so this shouldn't happen
- If it does, the column was added manually - you can ignore or skip that part

**Error: "UNIQUE constraint violation" when adding BOM lines**
- The constraint drop might have failed
- Check if constraint still exists:
  ```sql
  SELECT conname FROM pg_constraint 
  WHERE conrelid = 'design_bom'::regclass AND contype = 'u';
  ```
- If it exists, manually drop it:
  ```sql
  -- Replace 'constraint_name' with actual name from query above
  ALTER TABLE design_bom DROP CONSTRAINT constraint_name;
  ```

**Error: "relation design_labour_lines already exists"**
- Table was created manually
- Migration will skip due to `IF NOT EXISTS`
- You can safely continue

### Application Errors

**"Failed to fetch designs"**
- Check Supabase connection
- Verify environment variables are set
- Check browser console for detailed errors

**Cost computation returns null**
- Verify BOM and/or labour lines exist
- Check browser console for API errors
- Verify you have cost view permissions

**Status won't change to Ready**
- Check browser console for error message
- Verify base_selling_price > 0
- Verify at least one BOM or labour line exists
- Check API response for specific error

## 📋 Quick Verification Checklist

- [ ] Migration 007 applied successfully
- [ ] Can create new products
- [ ] Can add BOM lines with wastage
- [ ] Can add multiple labour steps
- [ ] Cost computation works
- [ ] Can save base COGS (admin/manager)
- [ ] Can mark product as Ready
- [ ] POS shows only Ready products
- [ ] Cost fields hidden for non-authorized roles
- [ ] Roadmap page loads correctly
- [ ] All placeholder pages work (no 404 errors)

## 🎯 You're Ready!

Once you've applied the migration and verified the above, your Phase 1 Product Builder is **fully functional**! 

All the code is complete - you just need to apply the database migration to enable the features.

---

**Questions?** Check the main README.md or review the migration file comments for details.
