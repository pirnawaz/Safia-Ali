import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { designSchema } from "@/lib/validations/design"
import { canViewCostPrice } from "@/lib/auth/permissions"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient()

    // Check if user can view cost prices
    const canViewCosts = await canViewCostPrice(user.id)

    // Use appropriate view/table based on permissions
    const tableName = canViewCosts ? "designs" : "designs_public"

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch designs" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient()

    const body = await request.json()
    const validated = designSchema.parse(body)

    const { data, error } = await supabase
      .from("designs")
      .insert({
        ...validated,
        base_cost_price: validated.base_cost_price ?? 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Failed to create design" },
      { status: 500 }
    )
  }
}

