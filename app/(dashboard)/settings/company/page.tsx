import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "Company profile and contact information",
  "Tax settings and rates",
  "Currency and locale configuration",
  "Business hours and calendar",
  "Logo and branding settings"
]

export default function SettingsCompanyPage() {
  return (
    <ComingSoon
      title="Company Settings"
      phase="Phase 5"
      description="Manage company profile and business settings."
      bullets={bullets}
    />
  )
}
