import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { calculateBaseCostPrice, getCostBreakdown } from "@/lib/calculations/cost"
import { getUserRole } from "@/lib/auth/permissions"

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
      .order("sort_order", { ascending: true })

    if (bomError) throw bomError

    // Get labour lines
    const { data: labourLines, error: labourError } = await supabase
      .from("design_labour_lines")
      .select("*")
      .eq("design_id", params.id)
      .order("sort_order", { ascending: true })

    if (labourError) throw labourError

    const bomWithCosts = (bomItems || []).map((item: any) => ({
      inventory_item_id: item.inventory_item_id,
      quantity: item.quantity,
      wastage_pct: item.wastage_pct ?? 0,
      cost_override: item.cost_override,
      weighted_avg_cost: item.inventory_items?.weighted_avg_cost,
    }))

    const labourLinesData = (labourLines || []).map((line: any) => ({
      labour_type: line.labour_type,
      rate: line.rate,
      qty: line.qty,
    }))

    const computedCost = calculateBaseCostPrice(bomWithCosts, labourLinesData)
    const breakdown = getCostBreakdown(bomWithCosts, labourLinesData)

    // Update design with computed cost
    const { error: updateError } = await supabase
      .from("designs")
      .update({ 
        base_cost_price: computedCost,
        cost_last_computed_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (updateError) throw updateError

    // Insert into cost audit
    const { error: auditError } = await supabase
      .from("design_cost_audit")
      .insert({
        design_id: params.id,
        computed_cost: computedCost,
        computed_breakdown: breakdown,
        saved_by: user.id,
      })

    if (auditError) {
      // Log but don't fail the request
      console.error("Failed to save cost audit:", auditError)
    }

    return NextResponse.json({
      base_cost_price: computedCost,
      breakdown,
      saved_at: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save cost" },
      { status: 500 }
    )
  }
}
