import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { designSchema } from "@/lib/validations/design"
import { getUserRole } from "@/lib/auth/permissions"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const { data, error } = await supabase
      .from("designs")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch design" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient()
    const role = await getUserRole(user.id)

    const body = await request.json()
    const validated = designSchema.parse(body)

    // Check if trying to set status to 'ready'
    if (validated.status === "ready") {
      // Enforce readiness rules
      const { count: bomCount } = await supabase
        .from("design_bom")
        .select("*", { count: "exact", head: true })
        .eq("design_id", params.id)

      const { count: labourCount } = await supabase
        .from("design_labour_lines")
        .select("*", { count: "exact", head: true })
        .eq("design_id", params.id)

      const totalLines = (bomCount ?? 0) + (labourCount ?? 0)

      if (validated.base_selling_price <= 0) {
        return NextResponse.json(
          { error: "Cannot set status to ready: base selling price must be greater than 0" },
          { status: 400 }
        )
      }

      if (totalLines < 1) {
        return NextResponse.json(
          { error: "Cannot set status to ready: product must have at least one BOM line or labour line" },
          { status: 400 }
        )
      }
    }

    // Only admin/manager can update designs
    if (role !== "admin" && role !== "manager") {
      return NextResponse.json(
        { error: "Unauthorized: Admin or Manager role required" },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from("designs")
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
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
      { error: error.message || "Failed to update design" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // PATCH is same as PUT but allows partial updates
  return PUT(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const { error } = await supabase
      .from("designs")
      .delete()
      .eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ message: "Design deleted" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete design" },
      { status: 500 }
    )
  }
}

