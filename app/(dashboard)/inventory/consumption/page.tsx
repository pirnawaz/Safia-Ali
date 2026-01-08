import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "View consumption reports by job card and stage",
  "Track material usage trends",
  "Low stock alerts and reorder suggestions",
  "GRN improvements + supplier tracking",
  "True COGS per order from actual consumption"
]

export default function InventoryConsumptionPage() {
  return (
    <ComingSoon
      title="Inventory Consumption & Procurement"
      phase="Phase 4"
      description="Track inventory consumption and manage procurement."
      bullets={bullets}
    />
  )
}
