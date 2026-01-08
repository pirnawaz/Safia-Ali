import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "Stock levels and valuations",
  "Material consumption reports",
  "Low stock and reorder alerts",
  "Inventory turnover analysis",
  "Stock movement history"
]

export default function ReportsInventoryPage() {
  return (
    <ComingSoon
      title="Inventory Reports"
      phase="Phase 5"
      description="Inventory analytics and stock management insights."
      bullets={bullets}
    />
  )
}
