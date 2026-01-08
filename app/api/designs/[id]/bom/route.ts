import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { bomItemSchema, designBOMSchema } from "@/lib/validations/design"
import { canViewCostPrice, getUserRole } from "@/lib/auth/permissions"

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
    const tableName = canViewCosts ? "design_bom" : "design_bom_public"
    
    // Adjust inventory_items join based on permissions
    const inventorySelect = canViewCosts
      ? "inventory_items (id, sku, name, uom, weighted_avg_cost)"
      : "inventory_items (id, sku, name, uom)"

    const { data, error } = await supabase
      .from(tableName)
      .select(`
        *,
        ${inventorySelect}
      `)
      .eq("design_id", params.id)
      .order("sort_order", { ascending: true })

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
    
    // Support both array of items (bulk replace) or single item (add)
    if (Array.isArray(body.items)) {
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
        wastage_pct: item.wastage_pct ?? 0,
        cost_override: item.cost_override ?? null,
        sort_order: item.sort_order ?? 0,
      }))

      const { data, error } = await supabase
        .from("design_bom")
        .insert(bomItems)
        .select()

      if (error) throw error
      return NextResponse.json(data, { status: 201 })
    } else {
      // Single item creation
      const validated = bomItemSchema.parse(body)

      const { data, error } = await supabase
        .from("design_bom")
        .insert({
          design_id: params.id,
          inventory_item_id: validated.inventory_item_id,
          quantity: validated.quantity,
          uom: validated.uom,
          wastage_pct: validated.wastage_pct ?? 0,
          cost_override: validated.cost_override ?? null,
          sort_order: validated.sort_order ?? 0,
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
      { error: error.message || "Failed to update BOM" },
      { status: 500 }
    )
  }
}

