import { createServiceRoleClient } from "@/lib/supabase/server"
import type { UserRole } from "./roles"

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_roles(name)')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  
  const roleName = (data as any).user_roles?.name
  return roleName as UserRole | null
}

export async function hasPermission(
  userId: string,
  permissionName: string
): Promise<boolean> {
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .rpc('has_permission', {
      user_id: userId,
      permission_name: permissionName,
    })
    .single()

  if (error || !data) return false
  return data as boolean
}

export async function canViewCostPrice(userId: string): Promise<boolean> {
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .rpc('can_view_cost_price', {
      user_id: userId,
    })
    .single()

  if (error || !data) return false
  return data as boolean
}

