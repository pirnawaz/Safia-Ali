# Safia Ali ERP - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Clone and Install
```bash
git clone <repository-url>
cd "Safia Ali"
npm install
```

### Step 2: Configure Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project (or use existing)
3. Go to **SQL Editor** and run these migrations **in order**:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_seed_data.sql`
   - `supabase/migrations/004_cost_price_security.sql` ⚠️ **CRITICAL**
   - `supabase/migrations/005_storage_setup.sql` (creates buckets)
   - `supabase/migrations/006_inventory_transactions.sql`

4. **Create Storage Policies (REQUIRED):**
   - Go to **Storage** → **Policies** tab
   - Follow instructions in `STORAGE_POLICIES.md`
   - Create 6 policies total (3 per bucket)
   - ⚠️ This CANNOT be done via SQL - must use Dashboard UI

### Step 3: Environment Variables
```bash
# Copy template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# Get from: Settings → API in Supabase Dashboard
```

Your `.env.local` should look like:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Create Admin User
```bash
# Start the app
npm run dev

# Go to http://localhost:3000/auth/signup
# Create an account with your email

# In Supabase SQL Editor, run:
UPDATE user_profiles
SET role_id = (SELECT id FROM user_roles WHERE name = 'admin')
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com'
);
```

### Step 5: Login and Explore
1. Go to http://localhost:3000/auth/login
2. Login with your admin account
3. Navigate to `/admin/users` to manage users
4. Explore the POS at `/pos`
5. Check production board at `/production/board`

---

## 📱 Key URLs

- **Login**: `/auth/login`
- **Dashboard**: `/dashboard`
- **POS**: `/pos`
- **Admin Users**: `/admin/users`
- **Production Board**: `/production/board`
- **Designs**: `/designs`
- **Inventory**: `/inventory`
- **Sales Orders**: `/sales/orders`

---

## 🔑 Default Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| **admin** | Full access, user management | Owner, IT admin |
| **manager** | View costs, override inventory | Store manager |
| **accounts** | View costs, reports | Accountant |
| **staff** | Production, inventory | Production staff |
| **pos_operator** | Sales, customers | Sales staff |

---

## ⚠️ Critical Security Notes

### Cost Price Protection
- **Non-admin users CANNOT see cost prices**
- Protected at database level with RLS
- Enforced via `_public` views
- Test with non-admin account before production!

### Service Role Key
- **NEVER commit `.env.local` to git**
- **NEVER expose service role key to browser**
- Only used server-side in API routes

---

## 🧪 Quick Test

### Test Cost Price Security
```bash
# 1. Login as admin
# 2. Open browser console
# 3. Run:
fetch('/api/designs').then(r => r.json()).then(console.log)
# Should see "base_cost_price" field

# 4. Create a POS operator user in /admin/users
# 5. Logout and login as POS operator
# 6. Run same fetch command
# Should NOT see "base_cost_price" field
```

### Test Responsiveness
1. Open POS page (`/pos`)
2. Open Chrome DevTools (F12)
3. Toggle device toolbar (Ctrl+Shift+M)
4. Test on:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

---

## 🐛 Common Issues

### "Missing required environment variables"
**Fix**: Create `.env.local` with all required variables from `.env.example`

### "Unauthorized" errors
**Fix**: 
1. Check user has a role assigned in `user_profiles` table
2. Verify RLS policies are enabled in Supabase

### Cost prices visible to non-admin
**Fix**: 
1. Re-run migration 004
2. Verify API routes use `_public` views
3. Clear browser cache

### Inventory race conditions
**Fix**: 
1. Re-run migration 006
2. Verify API uses `issue_inventory_transaction()` function

---

## 📚 Full Documentation

- **Deployment**: See `DEPLOYMENT_CHECKLIST.md`
- **Implementation**: See `IMPLEMENTATION_SUMMARY.md`
- **README**: See `README.md`

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] All 6 migrations applied
- [ ] Environment variables configured
- [ ] First admin user created
- [ ] Cost price security tested
- [ ] Responsiveness tested on real devices
- [ ] Storage buckets configured
- [ ] Auth redirect URLs set in Supabase
- [ ] RLS policies verified active
- [ ] Service role key kept secret
- [ ] `.env.local` NOT committed to git

---

## 🚢 Deploy to Production

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Add environment variables in Netlify dashboard
```

---

## 📞 Need Help?

1. Check `DEPLOYMENT_CHECKLIST.md` for detailed steps
2. Review `IMPLEMENTATION_SUMMARY.md` for technical details
3. Check Supabase logs in Dashboard → Logs
4. Review browser console for client errors

---

**Quick Start Version:** 1.0
**Last Updated:** January 7, 2026

