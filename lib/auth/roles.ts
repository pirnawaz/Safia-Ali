export type UserRole = 'admin' | 'manager' | 'accounts' | 'staff' | 'pos_operator'

export const ROLES: Record<UserRole, { name: string; description: string }> = {
  admin: {
    name: 'Admin',
    description: 'Full system access',
  },
  manager: {
    name: 'Manager',
    description: 'Management access with cost visibility',
  },
  accounts: {
    name: 'Accounts',
    description: 'Accounting and financial access',
  },
  staff: {
    name: 'Staff',
    description: 'Production and operations staff',
  },
  pos_operator: {
    name: 'POS Operator',
    description: 'Point of sale operator',
  },
}

export function hasRole(userRole: UserRole | null, requiredRole: UserRole): boolean {
  if (!userRole) return false
  
  const roleHierarchy: Record<UserRole, number> = {
    admin: 5,
    manager: 4,
    accounts: 3,
    staff: 2,
    pos_operator: 1,
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function canViewCostPrice(userRole: UserRole | null): boolean {
  if (!userRole) return false
  return ['admin', 'manager', 'accounts'].includes(userRole)
}

export function canEditPricing(userRole: UserRole | null): boolean {
  if (!userRole) return false
  return ['admin', 'manager'].includes(userRole)
}

export function canOverrideInventory(userRole: UserRole | null): boolean {
  if (!userRole) return false
  return ['admin', 'manager'].includes(userRole)
}

export function canManageUsers(userRole: UserRole | null): boolean {
  if (!userRole) return false
  return userRole === 'admin'
}

