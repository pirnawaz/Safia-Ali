import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "Company information and settings",
  "User management and roles",
  "Permission configurations",
  "System preferences",
  "Integration settings"
]

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Settings & Configuration"
      phase="Phase 5"
      description="System settings, user management, and configuration."
      bullets={bullets}
    />
  )
}
