import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { labourCostSchema } from "@/lib/validations/design"
import { canViewCostPrice } from "@/lib/auth/permissions"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient()

    // Check if user can view cost prices
    const canViewCosts = await canViewCostPrice(user.id)

    // Use appropriate view/table based on permissions
    const tableName = canViewCosts ? "design_labour_costs" : "design_labour_public"

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("design_id", params.id)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json(data || null)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch labour costs" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const body = await request.json()
    const validated = labourCostSchema.parse({
      ...body,
      design_id: params.id,
    })

    const { data, error } = await supabase
      .from("design_labour_costs")
      .upsert(validated, {
        onConflict: "design_id",
      })
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
      { error: error.message || "Failed to update labour costs" },
      { status: 500 }
    )
  }
}

