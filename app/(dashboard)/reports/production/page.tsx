import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "Job card status and stage analytics",
  "Production efficiency metrics",
  "Stage-wise time tracking",
  "Alteration rate analysis",
  "Production capacity planning"
]

export default function ReportsProductionPage() {
  return (
    <ComingSoon
      title="Production Reports"
      phase="Phase 5"
      description="Production performance and efficiency analytics."
      bullets={bullets}
    />
  )
}
