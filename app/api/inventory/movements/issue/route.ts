import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient, createServiceRoleClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { canIssueQuantity } from "@/lib/inventory/availability"
import { canOverrideInventory } from "@/lib/auth/roles"

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
      job_card_id,
      override,
      notes,
    } = body

    if (!inventory_item_id || !location_id || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get stock level
    const { data: stockLevel, error: stockError } = await serviceSupabase
      .from("stock_levels")
      .select("*")
      .eq("inventory_item_id", inventory_item_id)
      .eq("location_id", location_id)
      .single()

    if (stockError || !stockLevel) {
      return NextResponse.json(
        { error: "Stock level not found" },
        { status: 404 }
      )
    }

    // Check availability
    const { canIssue, available, requiresOverride } = canIssueQuantity(
      stockLevel,
      quantity,
      override === true
    )

    if (!canIssue) {
      return NextResponse.json(
        {
          error: "Insufficient stock",
          available,
          requiresOverride: requiresOverride,
        },
        { status: 400 }
      )
    }

    if (requiresOverride && !override) {
      // Check if user has override permission
      const { data: profile } = await serviceSupabase
        .from("user_profiles")
        .select("user_roles(name)")
        .eq("id", user.id)
        .single()

      const roleName = (profile as any)?.user_roles?.name
      if (!canOverrideInventory(roleName)) {
        return NextResponse.json(
          {
            error: "Override required but user lacks permission",
            available,
            requiresOverride: true,
          },
          { status: 403 }
        )
      }
    }

    // Get cost for movement
    const { data: item } = await serviceSupabase
      .from("inventory_items")
      .select("weighted_avg_cost")
      .eq("id", inventory_item_id)
      .single()

    const cost = item?.weighted_avg_cost || 0

    // Update stock level
    await serviceSupabase
      .from("stock_levels")
      .update({
        quantity: stockLevel.quantity - quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("inventory_item_id", inventory_item_id)
      .eq("location_id", location_id)

    // Reduce reservation if job card provided
    if (job_card_id) {
      await serviceSupabase
        .from("inventory_reservations")
        .update({ released_at: new Date().toISOString() })
        .eq("job_card_id", job_card_id)
        .eq("inventory_item_id", inventory_item_id)
        .is("released_at", null)

      // Update reserved quantity in stock level
      await serviceSupabase
        .from("stock_levels")
        .update({
          reserved_quantity: Math.max(0, stockLevel.reserved_quantity - quantity),
        })
        .eq("inventory_item_id", inventory_item_id)
        .eq("location_id", location_id)
    }

    // Create stock movement
    await serviceSupabase.from("stock_movements").insert({
      type: "issue",
      inventory_item_id,
      location_id,
      quantity: -quantity,
      cost,
      reference_id: job_card_id,
      user_id: user.id,
      notes: override ? `OVERRIDE: ${notes || ""}` : notes,
    })

    // Log audit if override
    if (override) {
      await serviceSupabase.from("audit_logs").insert({
        table_name: "stock_levels",
        record_id: stockLevel.id,
        action: "update",
        old_values: { quantity: stockLevel.quantity },
        new_values: { quantity: stockLevel.quantity - quantity },
        user_id: user.id,
      })
    }

    return NextResponse.json({ message: "Stock issued successfully" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to issue stock" },
      { status: 500 }
    )
  }
}

