import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/lib/rbac-nav";

export default function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge
      variant="secondary"
      className="capitalize border border-border bg-muted text-foreground"
    >
      {role.replace("_", " ")}
    </Badge>
  );
}

