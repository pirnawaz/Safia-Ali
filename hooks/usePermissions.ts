"use client"

import { useAuth } from "./useAuth"
import {
  canViewCostPrice,
  canEditPricing,
  canOverrideInventory,
  canManageUsers,
} from "@/lib/auth/roles"

export function usePermissions() {
  const { role } = useAuth()

  return {
    canViewCostPrice: canViewCostPrice(role),
    canEditPricing: canEditPricing(role),
    canOverrideInventory: canOverrideInventory(role),
    canManageUsers: canManageUsers(role),
    role,
  }
}

