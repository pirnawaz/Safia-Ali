import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { calculateBaseCostPrice, getCostBreakdown } from "@/lib/calculations/cost"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    // Get BOM items
    const { data: bomItems, error: bomError } = await supabase
      .from("design_bom")
      .select(`
        *,
        inventory_items (
          id,
          weighted_avg_cost
        )
      `)
      .eq("design_id", params.id)

    if (bomError) throw bomError

    // Get labour costs
    const { data: labourCosts, error: labourError } = await supabase
      .from("design_labour_costs")
      .select("*")
      .eq("design_id", params.id)
      .single()

    if (labourError && labourError.code !== "PGRST116") {
      throw labourError
    }

    const bomWithCosts = (bomItems || []).map((item: any) => ({
      inventory_item_id: item.inventory_item_id,
      quantity: item.quantity,
      unit_cost_reference: item.unit_cost_reference,
      weighted_avg_cost: item.inventory_items?.weighted_avg_cost,
    }))

    const labour = labourCosts || {
      cutting_cost: 0,
      embroidery_cost: 0,
      stitching_cost: 0,
      finishing_cost: 0,
    }

    const baseCostPrice = calculateBaseCostPrice(bomWithCosts, labour)
    const breakdown = getCostBreakdown(bomWithCosts, labour)

    // Update design with computed cost
    const { error: updateError } = await supabase
      .from("designs")
      .update({ base_cost_price: baseCostPrice })
      .eq("id", params.id)

    if (updateError) throw updateError

    return NextResponse.json({
      base_cost_price: baseCostPrice,
      breakdown,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to compute cost" },
      { status: 500 }
    )
  }
}

