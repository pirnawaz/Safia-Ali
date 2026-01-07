import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient, createServiceRoleClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { updateWeightedAverageAfterGRN } from "@/lib/inventory/weighted-average"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient()
    const serviceSupabase = createServiceRoleClient()

    const body = await request.json()
    const {
      inventory_item_id,
      location_id,
      quantity,
      cost,
      supplier_id,
      notes,
    } = body

    if (!inventory_item_id || !location_id || !quantity || !cost) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get current stock level
    const { data: stockLevel, error: stockError } = await serviceSupabase
      .from("stock_levels")
      .select("*")
      .eq("inventory_item_id", inventory_item_id)
      .eq("location_id", location_id)
      .single()

    const currentQuantity = stockLevel?.quantity || 0
    const currentCost = stockLevel
      ? await serviceSupabase
          .from("inventory_items")
          .select("weighted_avg_cost")
          .eq("id", inventory_item_id)
          .single()
          .then((r) => r.data?.weighted_avg_cost || 0)
      : 0

    // Calculate new weighted average cost
    const newWeightedAvgCost = updateWeightedAverageAfterGRN(
      currentQuantity,
      currentCost,
      quantity,
      cost
    )

    // Update inventory item weighted average cost
    await serviceSupabase
      .from("inventory_items")
      .update({ weighted_avg_cost: newWeightedAvgCost })
      .eq("id", inventory_item_id)

    // Update or create stock level
    if (stockLevel) {
      await serviceSupabase
        .from("stock_levels")
        .update({
          quantity: currentQuantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("inventory_item_id", inventory_item_id)
        .eq("location_id", location_id)
    } else {
      await serviceSupabase.from("stock_levels").insert({
        inventory_item_id,
        location_id,
        quantity,
        reserved_quantity: 0,
      })
    }

    // Create stock movement record
    await serviceSupabase.from("stock_movements").insert({
      type: "grn",
      inventory_item_id,
      location_id,
      quantity,
      cost,
      reference_id: supplier_id,
      user_id: user.id,
      notes,
    })

    return NextResponse.json({
      message: "GRN created successfully",
      new_weighted_avg_cost: newWeightedAvgCost,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create GRN" },
      { status: 500 }
    )
  }
}

