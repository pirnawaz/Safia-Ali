import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { getUserRole } from "@/lib/auth/permissions"

/**
 * PATCH /api/admin/users/[id]/role
 * Update a user's role
 * Admin only, cannot change own role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const role = await getUserRole(user.id)

    // Only admins can change roles
    if (role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    // Prevent users from changing their own role
    if (user.id === params.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { role_name } = body

    if (!role_name) {
      return NextResponse.json(
        { error: "role_name is required" },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get the role ID
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("id, name")
      .eq("name", role_name)
      .single()

    if (roleError || !roleData) {
      return NextResponse.json(
        { error: "Invalid role name" },
        { status: 400 }
      )
    }

    // Get old role for audit log
    const { data: oldProfile } = await supabase
      .from("user_profiles")
      .select("role_id, user_roles(name)")
      .eq("id", params.id)
      .single()

    // Update the user's role
    const { data, error } = await supabase
      .from("user_profiles")
      .update({ role_id: roleData.id, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    // Log the role change in audit_logs
    await supabase.from("audit_logs").insert({
      table_name: "user_profiles",
      record_id: params.id,
      action: "update",
      old_values: {
        role_id: oldProfile?.role_id,
        role_name: (oldProfile as any)?.user_roles?.name,
      },
      new_values: {
        role_id: roleData.id,
        role_name: roleData.name,
      },
      user_id: user.id,
    })

    return NextResponse.json({
      message: "Role updated successfully",
      data,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update role" },
      { status: 500 }
    )
  }
}

