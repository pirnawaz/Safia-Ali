"use client"

import { usePermissions } from "@/hooks/usePermissions"

interface PermissionGateProps {
  children: React.ReactNode
  permission: "viewCostPrice" | "editPricing" | "overrideInventory" | "manageUsers"
  fallback?: React.ReactNode
}

export function PermissionGate({
  children,
  permission,
  fallback = null,
}: PermissionGateProps) {
  const permissions = usePermissions()

  const hasPermission =
    permission === "viewCostPrice" && permissions.canViewCostPrice ||
    permission === "editPricing" && permissions.canEditPricing ||
    permission === "overrideInventory" && permissions.canOverrideInventory ||
    permission === "manageUsers" && permissions.canManageUsers

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

