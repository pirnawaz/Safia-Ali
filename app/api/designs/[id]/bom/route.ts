import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { designBOMSchema } from "@/lib/validations/design"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const { data, error } = await supabase
      .from("design_bom")
      .select(`
        *,
        inventory_items (
          id,
          sku,
          name,
          uom,
          weighted_avg_cost
        )
      `)
      .eq("design_id", params.id)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch BOM" },
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
    const validated = designBOMSchema.parse({
      ...body,
      design_id: params.id,
    })

    // Delete existing BOM items
    await supabase
      .from("design_bom")
      .delete()
      .eq("design_id", params.id)

    // Insert new BOM items
    const bomItems = validated.items.map((item) => ({
      design_id: params.id,
      inventory_item_id: item.inventory_item_id,
      quantity: item.quantity,
      uom: item.uom,
      unit_cost_reference: item.unit_cost_reference,
    }))

    const { data, error } = await supabase
      .from("design_bom")
      .insert(bomItems)
      .select()

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
      { error: error.message || "Failed to update BOM" },
      { status: 500 }
    )
  }
}

