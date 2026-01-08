import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "Manage roles and permissions",
  "Create custom roles",
  "Assign permissions to roles",
  "Role-based access control configuration",
  "Permission audit trail"
]

export default function SettingsRolesPage() {
  return (
    <ComingSoon
      title="Roles & Permissions"
      phase="Phase 5"
      description="Configure roles and permissions for access control."
      bullets={bullets}
    />
  )
}
