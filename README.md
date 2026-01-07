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

### 3. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Shopify
SHOPIFY_STORE_URL=
SHOPIFY_ACCESS_TOKEN=
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Create First User

1. Navigate to `/auth/signup`
2. Create an account (default role: staff)
3. To create an admin user, use the Supabase dashboard or run:

```sql
UPDATE user_profiles
SET role_id = (SELECT id FROM user_roles WHERE name = 'admin')
WHERE id = 'your_user_id';
```

## Deployment

### Frontend (Netlify)

1. Push code to GitHub
2. Connect repository to Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Add environment variables in Netlify dashboard

### Backend (Supabase)

Migrations are already applied. Ensure RLS policies are enabled.

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

### Immutable History
- Job card snapshots preserve design, BOM, and labour costs at time of creation
- Historical data cannot be modified

### Cost Price Visibility
- Cost prices visible only to Admin, Manager, and Accounts roles
- Enforced via RLS policies and UI gates

### Inventory Integrity
- Cannot issue inventory beyond available unless Admin override
- All overrides logged in audit trail

### Production Stages
- Fabric Procurement → Dyeing → Cutting → Embroidery → Stitching → Finishing/QA → Ready → Dispatched → Delivered
- Supports Alteration Requested workflow state

## Support

For issues and questions, please contact the development team.

## License

Proprietary - All rights reserved
