import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "Issue materials against job cards and production stages",
  "Track consumption per job card",
  "Automatic inventory deduction",
  "Cost allocation to job cards",
  "Issue history and audit trail"
]

export default function InventoryIssuePage() {
  return (
    <ComingSoon
      title="Inventory Issue & Consumption"
      phase="Phase 4"
      description="Issue materials against job cards and track consumption."
      bullets={bullets}
    />
  )
}
