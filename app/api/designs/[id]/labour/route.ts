import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { labourLineSchema } from "@/lib/validations/design"
import { getUserRole } from "@/lib/auth/permissions"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const { data, error } = await supabase
      .from("design_labour_lines")
      .select("*")
      .eq("design_id", params.id)
      .order("sort_order", { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch labour lines" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    // Support both array of lines (bulk replace) or single line (add)
    if (Array.isArray(body)) {
      // Bulk insert
      const validated = body.map((line) => labourLineSchema.parse(line))

      // Delete existing labour lines
      await supabase
        .from("design_labour_lines")
        .delete()
        .eq("design_id", params.id)

      const labourLines = validated.map((line) => ({
        design_id: params.id,
        ...line,
      }))

      const { data, error } = await supabase
        .from("design_labour_lines")
        .insert(labourLines)
        .select()

      if (error) throw error
      return NextResponse.json(data, { status: 201 })
    } else {
      // Single line creation
      const validated = labourLineSchema.parse(body)

      const { data, error } = await supabase
        .from("design_labour_lines")
        .insert({
          design_id: params.id,
          ...validated,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data, { status: 201 })
    }
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Failed to update labour lines" },
      { status: 500 }
    )
  }
}
