import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "Reserve inventory against job cards",
  "View reserved quantities and availability",
  "Release reservations when job cards are cancelled",
  "Track reservation history",
  "Prevent double-booking of materials"
]

export default function InventoryReservationsPage() {
  return (
    <ComingSoon
      title="Inventory Reservations"
      phase="Phase 4"
      description="Reserve inventory against production job cards."
      bullets={bullets}
    />
  )
}
