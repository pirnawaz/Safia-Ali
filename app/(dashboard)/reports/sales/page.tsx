import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "Sales by product, customer, period",
  "Gross margin analysis",
  "Top products report",
  "Order status tracking",
  "Revenue trends and forecasts"
]

export default function ReportsSalesPage() {
  return (
    <ComingSoon
      title="Sales Reports"
      phase="Phase 5"
      description="Sales performance and revenue analytics."
      bullets={bullets}
    />
  )
}
