import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "Sales/profit reports (gross margin, top products)",
  "Production reports (job card status, stage analytics)",
  "Inventory reports (stock levels, consumption, valuations)",
  "Financial reports (revenue, expenses, profit & loss)",
  "Custom report builder and exports"
]

export default function ReportsPage() {
  return (
    <ComingSoon
      title="Reports & Analytics"
      phase="Phase 5"
      description="Comprehensive reporting and analytics for all business modules."
      bullets={bullets}
    />
  )
}
