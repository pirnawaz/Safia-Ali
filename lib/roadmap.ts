export type PhaseStatus = "done" | "in_progress" | "coming_soon"

export interface Phase {
  phase: number
  title: string
  status: PhaseStatus
  description: string
  bullets: string[]
  link: string
}

export const PHASES: Phase[] = [
  {
    phase: 0,
    title: "Foundation & Core Setup",
    status: "done",
    description: "Navigation, layout, branding, Pakistan localization, and RBAC foundation.",
    bullets: [
      "Navigation sanity and layout consolidation",
      "Sidebar with collapsible icon-only state",
      "Pakistan localization (PKR currency, Asia/Karachi timezone)",
      "Brand theme (charcoal, ivory, subtle gold)",
      "RBAC hygiene and cost visibility restrictions",
      "User profile and logout functionality"
    ],
    link: "/dashboard"
  },
  {
    phase: 1,
    title: "Product Creation & Base COGS",
    status: "in_progress",
    description: "Complete Product Builder with BOM, Labour costing, cost roll-up, and readiness gating.",
    bullets: [
      "Product master (SKU, name, category, status: draft/ready)",
      "BOM CRUD (materials, qty, unit, wastage%, cost override)",
      "Labour costing CRUD (multiple steps: type, rate, qty, notes)",
      "Cost roll-up computation (BOM + Labour)",
      "Save base COGS (admin/manager only)",
      "Status readiness rules (base_selling_price > 0, BOM + Labour count >= 1)",
      "POS filtering (Ready products only)"
    ],
    link: "/designs"
  },
  {
    phase: 2,
    title: "Sales Orders & Customisation",
    status: "coming_soon",
    description: "Complete sales order management with customisation tracking and pricing.",
    bullets: [
      "Create Sales Orders with customer, delivery date, notes",
      "Add line items from Products (Ready products only)",
      "Capture measurements & customisation notes per line",
      "Customisation delta costing (material substitutions + extra labour)",
      "Price approval + order confirmation (locks snapshot)",
      "Customer order history view"
    ],
    link: "/sales/orders"
  },
  {
    phase: 3,
    title: "Production / Job Cards",
    status: "coming_soon",
    description: "Production stage tracking, job card management, and alterations workflow.",
    bullets: [
      "Confirmed order auto-generates Job Cards",
      "Production stage tracking (Fabric → Dye → Cutting → Embroidery → Stitching → Finish)",
      "Stage history + SLA timers (optional)",
      "Alterations loop (return to production until accepted)",
      "Simple production board (Kanban view)"
    ],
    link: "/production/board"
  },
  {
    phase: 4,
    title: "Inventory Consumption & Procurement",
    status: "coming_soon",
    description: "Reserve inventory, issue materials, track consumption, and manage procurement.",
    bullets: [
      "Reserve inventory against job cards",
      "Issue/consume materials per job card/stage",
      "Low stock alerts and reorder suggestions",
      "GRN improvements + supplier tracking",
      "True COGS per order from actual consumption"
    ],
    link: "/inventory/consumption"
  },
  {
    phase: 5,
    title: "Accounting, Reports & Settings",
    status: "coming_soon",
    description: "Financial management, comprehensive reporting, and system configuration.",
    bullets: [
      "Payments (partial, refunds) + receipts",
      "Basic accounting ledger/journals",
      "Sales/profit reports (gross margin, top products)",
      "Production & inventory reports",
      "Company settings, roles/permissions management"
    ],
    link: "/reports"
  }
]
