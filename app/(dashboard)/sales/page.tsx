import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "Create Sales Orders with customer, delivery date, notes",
  "Add line items from Products (Ready products only)",
  "Capture measurements & customisation notes per line",
  "Customisation delta costing (material substitutions + extra labour)",
  "Price approval + order confirmation (locks snapshot)",
  "Customer order history view"
]

export default function SalesPage() {
  return (
    <ComingSoon
      title="Sales Orders & Customisation"
      phase="Phase 2"
      description="Complete sales order management with customisation tracking and pricing."
      bullets={bullets}
    />
  )
}
