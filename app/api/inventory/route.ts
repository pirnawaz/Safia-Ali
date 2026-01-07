import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { inventoryItemSchema } from "@/lib/validations/inventory"
import { canViewCostPrice } from "@/lib/auth/permissions"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient()

    // Check if user can view cost prices
    const canViewCosts = await canViewCostPrice(user.id)

    // Use appropriate view/table based on permissions
    const tableName = canViewCosts ? "inventory_items" : "inventory_items_public"

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch inventory items" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const body = await request.json()
    const validated = inventoryItemSchema.parse(body)

    const { data, error } = await supabase
      .from("inventory_items")
      .insert(validated)
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
      { error: error.message || "Failed to create inventory item" },
      { status: 500 }
    )
  }
}

