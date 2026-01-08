import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "Payments (partial, refunds) + receipts",
  "Basic accounting ledger/journals",
  "Sales/profit reports (gross margin, top products)",
  "Production & inventory reports",
  "Company settings, roles/permissions management"
]

export default function AccountingPage() {
  return (
    <ComingSoon
      title="Accounting & Financial Management"
      phase="Phase 5"
      description="Complete accounting module with payments, receipts, and financial reporting."
      bullets={bullets}
    />
  )
}
