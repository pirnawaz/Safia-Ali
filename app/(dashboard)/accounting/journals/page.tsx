import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "Create and manage journal entries",
  "Double-entry bookkeeping validation",
  "Journal entry approvals",
  "Post and unpost entries",
  "Journal entry history and audit trail"
]

export default function AccountingJournalsPage() {
  return (
    <ComingSoon
      title="Journal Entries"
      phase="Phase 5"
      description="Create and manage accounting journal entries."
      bullets={bullets}
    />
  )
}
