import { createServerComponentClient } from "@/lib/supabase/server"
import { getUserRole } from "./permissions"
import type { UserRole } from "./roles"
import { redirect } from "next/navigation"

export async function getServerUser() {
  const supabase = await createServerComponentClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return null
  }

  return session.user
}

export async function requireAuth() {
  const user = await getServerUser()
  if (!user) {
    redirect("/auth/login")
  }
  return user
}

export async function getServerUserRole(): Promise<UserRole | null> {
  const user = await getServerUser()
  if (!user) return null
  return await getUserRole(user.id)
}

export async function requireRole(requiredRole: UserRole) {
  const user = await requireAuth()
  const role = await getUserRole(user.id)
  
  if (role !== requiredRole) {
    redirect("/dashboard")
  }
  
  return { user, role }
}

export async function requirePermission(permissionName: string) {
  const user = await requireAuth()
  const supabase = await createServerComponentClient()
  
  const { data, error } = await supabase
    .rpc('has_permission', {
      user_id: user.id,
      permission_name: permissionName,
    })
    .single()

  if (error || !data) {
    redirect("/dashboard")
  }
  
  return user
}

