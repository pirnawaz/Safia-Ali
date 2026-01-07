import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { getUserRole } from "@/lib/auth/permissions"

/**
 * GET /api/admin/roles
 * List all available roles
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const role = await getUserRole(user.id)

    // Only admins can list roles
    if (role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const supabase = await createServerComponentClient()

    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .order("name")

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch roles" },
      { status: 500 }
    )
  }
}

