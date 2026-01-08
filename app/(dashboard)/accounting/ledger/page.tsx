import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "General ledger with double-entry bookkeeping",
  "Chart of accounts",
  "Journal entries and adjustments",
  "Account balances and trial balance",
  "Financial statement generation"
]

export default function AccountingLedgerPage() {
  return (
    <ComingSoon
      title="General Ledger"
      phase="Phase 5"
      description="Manage general ledger and accounting entries."
      bullets={bullets}
    />
  )
}
