# Safia Ali ERP - Production Deployment Checklist

## ✅ Phase A — Supabase Environment Wiring

### Environment Variables Setup
- [x] `.env.example` created with all required keys
- [ ] Create `.env.local` file with actual Supabase credentials:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
  ```

### Client Configuration
- [x] Browser client uses anon key only (`lib/supabase/client.ts`)
- [x] Server actions use service role key (`lib/supabase/server.ts`)
- [x] Environment validation implemented (`lib/env.ts`)
- [x] No service role key imported client-side

### Verification Steps
1. Start the application: `npm run dev`
2. Verify environment validation catches missing variables
3. Check browser console - no service role key should be visible
4. Test authenticated API calls work correctly

---

## ✅ Phase B — Cost Price Security Hardening (MANDATORY)

### Database Views Created
- [x] `designs_public` - excludes `base_cost_price`
- [x] `design_bom_public` - excludes `unit_cost_reference`
- [x] `design_labour_public` - excludes cost fields
- [x] `inventory_items_public` - excludes `weighted_avg_cost`
- [x] `stock_movements_public` - excludes `cost`
- [x] `job_cards_public` - excludes cost fields

### RLS Policies Updated
- [x] Direct SELECT on `designs` restricted to admin/manager/accounts
- [x] Direct SELECT on `design_bom` restricted to admin/manager/accounts
- [x] Direct SELECT on `design_labour_costs` restricted to admin/manager/accounts
- [x] Direct SELECT on `inventory_items` restricted to admin/manager/accounts
- [x] Direct SELECT on `stock_movements` restricted to admin/manager/accounts

### Application Updates
- [x] `/api/designs` uses `designs_public` for non-authorized users
- [x] `/api/designs/[id]/bom` uses `design_bom_public` for non-authorized users
- [x] `/api/designs/[id]/labour` uses `design_labour_public` for non-authorized users
- [x] `/api/inventory` uses `inventory_items_public` for non-authorized users

### Manual Supabase Steps Required
1. **Apply Migration 004:**
   ```bash
   # In Supabase SQL Editor, run:
   supabase/migrations/004_cost_price_security.sql
   ```

2. **Verify RLS Policies:**
   - Go to Supabase Dashboard → Authentication → Policies
   - Confirm policies are active on all tables
   - Test with a non-admin user account

3. **Test Cost Price Visibility:**
   - Login as POS operator
   - Navigate to `/api/designs` - should NOT see `base_cost_price`
   - Login as admin
   - Navigate to `/api/designs` - SHOULD see `base_cost_price`

---

## ✅ Phase C — Admin Bootstrap & Role Safety

### Admin Role Management
- [x] Admin user management UI created (`/admin/users`)
- [x] Role assignment API endpoints (`/api/admin/users/[id]/role`)
- [x] Roles listing API (`/api/admin/roles`)
- [x] Users cannot edit their own role
- [x] All role changes logged in `audit_logs`

### Manual Setup Steps
1. **Bootstrap First Admin:**
   ```sql
   -- In Supabase SQL Editor:
   -- Replace 'user-email@example.com' with actual email
   UPDATE user_profiles
   SET role_id = (SELECT id FROM user_roles WHERE name = 'admin')
   WHERE id = (
     SELECT id FROM auth.users WHERE email = 'user-email@example.com'
   );
   ```

2. **Verify Admin Access:**
   - Login with admin account
   - Navigate to `/admin/users`
   - Verify you can see all users and change roles

---

## ✅ Phase D — Supabase Auth & Redirects

### Auth Configuration
- [x] Auth callback route exists (`/auth/callback`)
- [x] Session persistence via middleware
- [x] Login required for dashboard routes
- [x] Public routes limited to auth pages

### Verification Steps
1. Logout and try accessing `/dashboard` - should redirect to `/auth/login`
2. Login successfully - should redirect to `/dashboard`
3. Refresh page - session should persist
4. Check middleware logs for auth flow

---

## ✅ Phase E — Responsiveness (MANDATORY)

### POS
- [x] Tablet-first layout
- [x] Large touch targets (min 44px)
- [x] Sticky cart on mobile
- [x] Mobile-friendly product search
- [x] Touch-optimized quantity controls

### Dashboard
- [x] KPI cards stack correctly on mobile
- [x] Grid collapses cleanly on tablet/mobile
- [x] Responsive typography

### Production Board
- [x] Kanban scrolls horizontally on small screens
- [x] Stage updates usable on tablet
- [x] Touch-friendly buttons
- [x] Mobile hint for horizontal scroll

### Forms
- [x] No horizontal overflow
- [x] Inputs usable on touch devices
- [x] Responsive form layouts

### Testing Checklist
- [ ] Test on mobile device (< 640px)
- [ ] Test on tablet (640px - 1024px)
- [ ] Test on desktop (> 1024px)
- [ ] Test touch interactions
- [ ] Test keyboard navigation

---

## ✅ Phase F — Supabase Storage

### Storage Buckets
- [x] `documents` bucket created
- [x] `jobcard-photos` bucket created

### RLS Policies
- [x] Authenticated users can upload to both buckets
- [x] Only authorized roles can read `documents`
- [x] All users can read `jobcard-photos`
- [x] Only owner or admin can delete files

### Manual Supabase Steps Required
1. **Apply Migration 005:**
   ```bash
   # In Supabase SQL Editor, run:
   supabase/migrations/005_storage_setup.sql
   # This creates the storage buckets
   ```

2. **Create Storage Policies (MANUAL - Via Dashboard UI):**
   - Storage policies CANNOT be created via SQL due to permission restrictions
   - Follow the step-by-step guide in `STORAGE_POLICIES.md`
   - Go to Supabase Dashboard → Storage → Policies
   - Create 3 policies for `documents` bucket
   - Create 3 policies for `jobcard-photos` bucket
   - **This is REQUIRED for storage to work properly**

3. **Verify Storage Setup:**
   - Go to Supabase Dashboard → Storage
   - Confirm `documents` and `jobcard-photos` buckets exist
   - Verify 6 policies total are active (3 per bucket)

4. **Test File Upload:**
   - Upload a test file to each bucket
   - Verify access permissions work correctly
   - Test with different user roles

---

## ✅ Phase G — Production Hardening

### UI Components
- [x] Loading states implemented (`LoadingSpinner`, `LoadingCard`)
- [x] Error boundaries created (`ErrorBoundary`)
- [x] Empty state UI (`EmptyState`)

### Inventory Safety
- [x] Transactional inventory operations (`issue_inventory_transaction`)
- [x] Race condition prevention with row-level locking
- [x] Override requires admin role + audit log

### Manual Supabase Steps Required
1. **Apply Migration 006:**
   ```bash
   # In Supabase SQL Editor, run:
   supabase/migrations/006_inventory_transactions.sql
   ```

2. **Test Inventory Transactions:**
   - Issue inventory from multiple sessions simultaneously
   - Verify no race conditions occur
   - Check audit logs for override operations

### Data Export Safety
- [x] CSV export API exists (`/api/export/csv`)
- [ ] Test large dataset exports (> 10,000 records)
- [ ] Implement pagination if needed

---

## ✅ Phase H — Final Verification

### Database Security
- [ ] All tables have RLS enabled
- [ ] Cost price fields are NOT accessible via direct queries by non-authorized users
- [ ] Test with Postman/curl to attempt unauthorized access
- [ ] Verify audit logs capture sensitive operations

### Application Security
- [ ] No hardcoded credentials in code
- [ ] Service role key only used server-side
- [ ] All API routes require authentication
- [ ] Role-based access control enforced

### Performance
- [ ] Test with realistic data volumes
- [ ] Check query performance on large tables
- [ ] Verify indexes are in place
- [ ] Monitor Supabase dashboard for slow queries

### Responsiveness
- [ ] Test all major screens on mobile
- [ ] Verify touch targets are adequate
- [ ] Check for horizontal scroll issues
- [ ] Test on actual devices (not just browser DevTools)

---

## 🚀 Deployment Steps

### 1. Apply All Migrations
```bash
# Connect to your Supabase project
# In Supabase SQL Editor, run in order:

1. supabase/migrations/001_initial_schema.sql (already applied)
2. supabase/migrations/002_rls_policies.sql (already applied)
3. supabase/migrations/003_seed_data.sql (already applied)
4. supabase/migrations/004_cost_price_security.sql (NEW - APPLY NOW)
5. supabase/migrations/005_storage_setup.sql (NEW - APPLY NOW)
6. supabase/migrations/006_inventory_transactions.sql (NEW - APPLY NOW)
```

### 2. Configure Environment Variables
```bash
# Create .env.local with your Supabase credentials
cp .env.example .env.local
# Edit .env.local with actual values
```

### 3. Bootstrap First Admin User
```sql
-- In Supabase SQL Editor:
UPDATE user_profiles
SET role_id = (SELECT id FROM user_roles WHERE name = 'admin')
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com'
);
```

### 4. Build and Deploy
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm start

# Deploy to Vercel/Netlify/your hosting provider
```

### 5. Post-Deployment Verification
- [ ] Test login flow
- [ ] Verify admin can access `/admin/users`
- [ ] Test POS functionality
- [ ] Create a test order end-to-end
- [ ] Verify cost prices are hidden for non-admin users
- [ ] Test inventory operations
- [ ] Check production board
- [ ] Verify mobile responsiveness

---

## 📋 Manual Supabase Dashboard Steps

### Storage Configuration
1. **Create Buckets:**
   - Run migration 005 in SQL Editor (creates buckets)
   - Or manually create in Dashboard → Storage:
     - `documents` (Private)
     - `jobcard-photos` (Private)

2. **Create Storage Policies (REQUIRED):**
   - Go to Storage → Policies tab
   - Follow `STORAGE_POLICIES.md` for detailed instructions
   - Create 3 policies for `documents` bucket
   - Create 3 policies for `jobcard-photos` bucket
   - **Cannot be done via SQL - must use Dashboard UI**

### Auth Configuration
1. Go to **Authentication** → URL Configuration
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/auth/callback`

2. Enable email provider or your preferred auth method

### Database Configuration
1. Go to **Database** → Indexes
   - Verify all indexes from migration 001 exist

2. Go to **Database** → Policies
   - Verify RLS is enabled on all tables
   - Check policy counts match expectations

---

## 🔒 Security Audit Checklist

### Cost Price Protection
- [ ] Non-admin users CANNOT see `base_cost_price` in designs
- [ ] Non-admin users CANNOT see `weighted_avg_cost` in inventory
- [ ] Non-admin users CANNOT see cost in stock movements
- [ ] Direct table queries are blocked by RLS
- [ ] API endpoints respect role permissions

### Authentication & Authorization
- [ ] Unauthenticated users cannot access dashboard
- [ ] Role changes require admin privileges
- [ ] Users cannot change their own role
- [ ] Service role key is never exposed to browser

### Data Integrity
- [ ] Inventory operations are transactional
- [ ] No race conditions in stock updates
- [ ] Audit logs capture sensitive operations
- [ ] Overrides require proper permissions

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue: "Missing required environment variables"**
- Solution: Ensure `.env.local` exists with all required variables

**Issue: "Unauthorized" errors in API**
- Solution: Check user role in `user_profiles` table
- Verify RLS policies are active

**Issue: Cost prices visible to non-admin users**
- Solution: Re-run migration 004
- Verify API endpoints use `_public` views

**Issue: Inventory race conditions**
- Solution: Re-run migration 006
- Ensure API uses transactional functions

### Need Help?
- Check Supabase logs in Dashboard → Logs
- Review browser console for client errors
- Check server logs for API errors
- Verify database policies in Supabase Dashboard

---

## ✅ Final Sign-Off

Before going live, confirm:
- [ ] All migrations applied successfully
- [ ] First admin user created and tested
- [ ] Cost price security verified
- [ ] Responsiveness tested on real devices
- [ ] Storage buckets configured
- [ ] Auth flow works end-to-end
- [ ] Inventory operations are transactional
- [ ] Production build tested
- [ ] Environment variables configured
- [ ] Backup strategy in place

**Deployment Date:** _______________

**Deployed By:** _______________

**Sign-off:** _______________

