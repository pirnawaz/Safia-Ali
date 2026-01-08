import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "Create Sales Orders with customer, delivery date, notes",
  "Add line items from Products (Ready products only)",
  "Capture measurements & customisation notes per line",
  "Customisation delta costing (material substitutions + extra labour)",
  "Price approval + order confirmation (locks snapshot)",
  "Customer order history view"
]

export default function NewOrderPage() {
  return (
    <ComingSoon
      title="New Sales Order"
      phase="Phase 2"
      description="Create a new sales order with customisation options."
      bullets={bullets}
    />
  )
}
