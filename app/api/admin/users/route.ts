import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient, createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { getUserRole } from "@/lib/auth/permissions"

/**
 * GET /api/admin/users
 * List all users with their profiles and roles
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const role = await getUserRole(user.id)

    // Only admins can list users
    if (role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from("user_profiles")
      .select(`
        id,
        full_name,
        phone,
        created_at,
        updated_at,
        user_roles (
          id,
          name,
          description
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Also get email from auth.users
    const usersWithAuth = await Promise.all(
      (data || []).map(async (profile) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
        return {
          ...profile,
          email: authUser?.user?.email || null,
        }
      })
    )

    return NextResponse.json(usersWithAuth)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    )
  }
}

