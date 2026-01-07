# Safia Ali - Boutique ERP + POS

A production-ready Boutique ERP + POS web application for luxury made-to-order fashion boutique management.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Validation**: Zod
- **Data Fetching**: TanStack Query
- **PDF Generation**: PDFKit
- **Deployment**: Netlify (frontend) + Supabase (backend)

## Features

### Core Modules

1. **Master Data Management**
   - Designs (Products) with BOM and Labour Cost tracking
   - Inventory Items with weighted average costing
   - Customers, Suppliers, Locations, Taxes

2. **Sales & POS**
   - Sales order management
   - Point of Sale (POS) interface
   - Payment processing
   - Invoice and Receipt PDF generation (branded "Safia Ali")

3. **Production Management**
   - Job Cards with immutable snapshots
   - Production Kanban Board
   - Stage tracking with history
   - Alterations workflow

4. **Inventory Management**
   - Goods Received Notes (GRN)
   - Stock movements (issue, transfer, adjustment)
   - Inventory reservations
   - Low stock alerts
   - Weighted average costing

5. **Shopify Integration**
   - Order and customer sync
   - SKU mapping

6. **Reporting & Accounting**
   - Sales reports
   - Production reports
   - Inventory reports
   - Customer reports
   - CSV exports

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

### 1. Clone and Install

```bash
git clone https://github.com/pirnawaz/Safia-Ali.git
cd Safia-Ali
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_seed_data.sql`
   - `supabase/migrations/004_cost_price_security.sql` ⚠️ **CRITICAL - Cost Price Protection**
   - `supabase/migrations/005_storage_setup.sql`
   - `supabase/migrations/006_inventory_transactions.sql`

### 3. Environment Variables

Create a `.env.local` file (see `.env.example` for reference):

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application Configuration
NEXT_PUBLIC_APP_NAME="Safia Ali"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Shopify Integration
SHOPIFY_STORE_URL=
SHOPIFY_ACCESS_TOKEN=
```

⚠️ **IMPORTANT**: Never commit `.env.local` to version control. The `SUPABASE_SERVICE_ROLE_KEY` must remain secret.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Create First Admin User

1. Navigate to `/auth/signup` and create an account
2. In Supabase SQL Editor, promote the user to admin:

```sql
UPDATE user_profiles
SET role_id = (SELECT id FROM user_roles WHERE name = 'admin')
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

3. Login and navigate to `/admin/users` to manage other users

## Deployment

### Complete Deployment Guide

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for a comprehensive production deployment checklist.

### Quick Deploy

1. **Apply All Migrations** (in Supabase SQL Editor)
2. **Configure Environment Variables** (create `.env.local`)
3. **Bootstrap First Admin User** (run SQL to promote user)
4. **Build and Deploy**:
   ```bash
   npm run build
   npm start
   ```

### Frontend Deployment (Vercel/Netlify)

**Vercel (Recommended):**
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Netlify:**
1. Push code to GitHub
2. Connect repository to Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Add environment variables in Netlify dashboard

### Backend (Supabase)

1. Ensure all migrations are applied
2. Verify RLS policies are enabled on all tables
3. Configure storage buckets (`documents`, `jobcard-photos`)
4. Set up auth redirect URLs in Supabase dashboard

## Database Migrations

Apply migrations via Supabase SQL Editor or CLI:

```bash
supabase db push
```

## Testing

Run tests:

```bash
npm test
```

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   └── auth/             # Auth components
├── lib/                   # Utilities and helpers
│   ├── auth/              # Authentication utilities
│   ├── calculations/      # Business logic calculations
│   ├── inventory/          # Inventory utilities
│   ├── pdf/                # PDF generation
│   ├── supabase/           # Supabase clients
│   └── validations/        # Zod schemas
├── hooks/                  # React hooks
├── supabase/               # Database migrations
│   └── migrations/         # SQL migration files
└── __tests__/              # Test files
```

## Key Features

### 🔒 Security & Access Control
- **Cost Price Protection**: Cost prices visible only to Admin, Manager, and Accounts roles
- **Database Views**: Public views (`designs_public`, `inventory_items_public`, etc.) exclude sensitive cost data
- **RLS Enforcement**: Row-level security policies prevent unauthorized access at database level
- **Role-Based Access**: 5 roles (admin, manager, accounts, staff, pos_operator) with granular permissions
- **Audit Logging**: All sensitive operations logged with user, timestamp, and changes

### 📱 Responsive Design
- **Mobile-First POS**: Optimized for tablet use with large touch targets
- **Production Board**: Horizontal scroll Kanban for mobile devices
- **Touch-Friendly**: All interactive elements sized for touch (min 44px)
- **Adaptive Layouts**: Graceful degradation from desktop → tablet → mobile

### 🏭 Production Management
- **Immutable History**: Job card snapshots preserve design, BOM, and labour costs at time of creation
- **Stage Tracking**: Fabric Procurement → Dyeing → Cutting → Embroidery → Stitching → Finishing/QA → Ready → Dispatched → Delivered
- **Alterations Workflow**: Supports alteration requests with photo uploads
- **Kanban Board**: Visual production tracking with drag-and-drop stage updates

### 📦 Inventory Integrity
- **Transactional Operations**: Database-level transactions prevent race conditions
- **Row-Level Locking**: Prevents double-issue scenarios
- **Weighted Average Costing**: Automatic cost calculation on GRN
- **Override Protection**: Cannot issue beyond available unless Admin override (logged)
- **Reservation System**: Reserve inventory for job cards

### 🎨 User Experience
- **Loading States**: Skeleton screens and spinners for all async operations
- **Error Boundaries**: Graceful error handling with recovery options
- **Empty States**: Helpful messages and actions when no data exists
- **Optimistic Updates**: Instant UI feedback with background sync

## Security Considerations

### Cost Price Protection (CRITICAL)
- **Never** query `designs`, `design_bom`, `design_labour_costs`, `inventory_items`, or `stock_movements` tables directly from client
- **Always** use `_public` views for non-authorized users
- **Verify** RLS policies are active on all tables
- **Test** with non-admin users to ensure cost data is hidden

### Environment Variables
- **Never** commit `.env.local` to version control
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to browser
- **Always** use `NEXT_PUBLIC_` prefix only for public variables
- **Rotate** service role key if compromised

### Authentication
- **Enable** email verification in production
- **Configure** password strength requirements in Supabase
- **Set up** MFA for admin accounts
- **Review** auth logs regularly

## Troubleshooting

### "Missing required environment variables"
- Ensure `.env.local` exists with all required variables
- Check variable names match exactly (case-sensitive)
- Restart dev server after adding variables

### "Unauthorized" errors
- Check user role in `user_profiles` table
- Verify RLS policies are enabled
- Confirm user is authenticated

### Cost prices visible to non-admin users
- Re-run migration 004
- Verify API endpoints use `_public` views
- Check browser network tab for actual API responses

### Inventory race conditions
- Re-run migration 006
- Ensure API uses transactional functions (`issue_inventory_transaction`)
- Check database logs for lock timeouts

## Support

For issues and questions, please contact the development team.

## License

Proprietary - All rights reserved
