# Safia Ali ERP - Demo Walkthrough

This guide walks through the key features of the Safia Ali ERP system using seeded demo data.

## Prerequisites

1. Database migrations applied
2. Seed data loaded
3. User account created (admin role recommended)

## Step-by-Step Demo

### 1. Login
- Navigate to `/auth/login`
- Use your credentials to log in
- You should be redirected to the dashboard

### 2. View Master Data

#### Designs
- Navigate to `/designs`
- View existing designs (e.g., "Luxury Evening Gown", "Bridal Lehenga")
- Click on a design to view/edit details
- Note: Cost prices are only visible to Admin/Manager/Accounts roles

#### Inventory
- Navigate to `/inventory`
- View inventory items (fabrics, threads, beads, etc.)
- Check stock levels and reorder points

#### Customers
- Navigate to `/customers`
- View existing customers (Sarah Ahmed, Fatima Khan, etc.)

### 3. Create a Sales Order

#### Via POS
- Navigate to `/pos`
- Search for a design (e.g., "Luxury Evening Gown")
- Click to add to cart
- Adjust quantities
- Select/create customer
- Click "Checkout" to create order

#### Via Admin
- Navigate to `/sales/orders/new`
- Select customer
- Add items with quantities
- Set customisations if needed
- Create order

### 4. Confirm Order and Generate Job Cards

- Navigate to `/sales/orders`
- Click on a draft order
- Click "Confirm Order"
- System will:
  - Create job cards (one per unit)
  - Create immutable snapshots (design, BOM, labour)
  - Reserve inventory

### 5. Production Board

- Navigate to `/production/board`
- View kanban board with job cards by stage
- Use arrow buttons to move cards between stages
- Stages: Fabric Procurement → Dyeing → Cutting → Embroidery → Stitching → Finishing/QA → Ready → Dispatched → Delivered

### 6. Inventory Management

#### Create GRN
- Navigate to `/inventory/movements/grn`
- Select inventory item
- Enter quantity and cost
- System updates weighted average cost automatically

#### Issue to Job Card
- Navigate to `/inventory/movements/issue`
- Select job card
- Select items and quantities
- System checks availability and reduces reservations

#### Low Stock Dashboard
- Navigate to `/inventory/dashboard`
- View items below reorder level

### 7. Alterations

- Navigate to `/production/alterations`
- Create alteration request from Ready/Delivered job card
- System creates new alteration cycle job card
- View alteration chain

### 8. Reports

- Navigate to `/reports/sales`
- View sales reports by date range
- Export to CSV

- Navigate to `/reports/production`
- View WIP by stage
- Check late jobs
- View alteration counts

### 9. Generate Invoice/Receipt

- Navigate to `/sales/orders/[id]`
- Click "Generate Invoice"
- PDF downloads branded "Safia Ali"

- For payments, click "Generate Receipt"
- PDF receipt downloads

## Key Features Demonstrated

1. **Immutable Snapshots**: Job card snapshots preserve historical data
2. **Cost Visibility**: Cost prices hidden from unauthorized users
3. **Inventory Integrity**: Cannot issue beyond available (override requires permission)
4. **Production Tracking**: Stage history maintained for audit
5. **Alterations Loop**: Unlimited alteration cycles with full history

## Notes

- All PDFs are branded "Safia Ali"
- Audit logs track all critical operations
- RLS policies enforce data access based on roles
- Weighted average costing updates automatically on GRN

