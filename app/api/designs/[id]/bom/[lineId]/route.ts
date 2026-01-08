import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { bomItemSchema } from "@/lib/validations/design"
import { getUserRole } from "@/lib/auth/permissions"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; lineId: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient()

    // Check permissions (admin/manager only)
    const role = await getUserRole(user.id)
    if (role !== "admin" && role !== "manager") {
      return NextResponse.json(
        { error: "Unauthorized: Admin or Manager role required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = bomItemSchema.partial().parse(body)

    const { data, error } = await supabase
      .from("design_bom")
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.lineId)
      .eq("design_id", params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Failed to update BOM line" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; lineId: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient()

    // Check permissions (admin/manager only)
    const role = await getUserRole(user.id)
    if (role !== "admin" && role !== "manager") {
      return NextResponse.json(
        { error: "Unauthorized: Admin or Manager role required" },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from("design_bom")
      .delete()
      .eq("id", params.lineId)
      .eq("design_id", params.id)

    if (error) throw error
    return NextResponse.json({ message: "BOM line deleted" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete BOM line" },
      { status: 500 }
    )
  }
}
