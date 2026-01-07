import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient, createServiceRoleClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient()
    const serviceSupabase = createServiceRoleClient()

    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from("sales_orders")
      .select(`
        *,
        sales_order_items (
          *,
          designs (*)
        )
      `)
      .eq("id", params.id)
      .single()

    if (orderError) throw orderError

    if (order.status !== "draft") {
      return NextResponse.json(
        { error: "Order is not in draft status" },
        { status: 400 }
      )
    }

    // Update order status
    await supabase
      .from("sales_orders")
      .update({ status: "confirmed" })
      .eq("id", params.id)

    // Create job cards for items that require them
    const jobCards = []
    for (const item of order.sales_order_items) {
      if (item.requires_job_card) {
        // Create one job card per unit
        for (let i = 0; i < item.quantity; i++) {
          // Generate job number
          const { data: lastJob } = await serviceSupabase
            .from("job_cards")
            .select("job_number")
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          let jobNumber = "JC-0001"
          if (lastJob?.job_number) {
            const lastNum = parseInt(lastJob.job_number.split("-")[1])
            jobNumber = `JC-${String(lastNum + 1).padStart(4, "0")}`
          }

          // Create job card
          const { data: jobCard, error: jobCardError } = await serviceSupabase
            .from("job_cards")
            .insert({
              job_number: jobNumber,
              sales_order_item_id: item.id,
              customer_id: order.customer_id,
              design_id: item.design_id,
              current_stage: "fabric_procurement",
              status: "active",
              estimated_cost: item.design_id
                ? (await serviceSupabase
                    .from("designs")
                    .select("base_cost_price")
                    .eq("id", item.design_id)
                    .single()).data?.base_cost_price || 0
                : 0,
            })
            .select()
            .single()

          if (jobCardError) throw jobCardError

          // Create snapshots
          if (item.design_id) {
            const { data: design } = await serviceSupabase
              .from("designs")
              .select("*")
              .eq("id", item.design_id)
              .single()

            if (design) {
              await serviceSupabase
                .from("job_card_design_snapshots")
                .insert({
                  job_card_id: jobCard.id,
                  design_data: design,
                })

              // Get BOM
              const { data: bom } = await serviceSupabase
                .from("design_bom")
                .select(`
                  *,
                  inventory_items (*)
                `)
                .eq("design_id", item.design_id)

              if (bom) {
                await serviceSupabase
                  .from("job_card_bom_snapshots")
                  .insert({
                    job_card_id: jobCard.id,
                    bom_data: bom,
                  })

                // Create inventory reservations
                for (const bomItem of bom) {
                  await serviceSupabase
                    .from("inventory_reservations")
                    .insert({
                      job_card_id: jobCard.id,
                      inventory_item_id: bomItem.inventory_item_id,
                      location_id: (
                        await serviceSupabase
                          .from("locations")
                          .select("id")
                          .eq("type", "workshop")
                          .single()
                      ).data?.id,
                      quantity: bomItem.quantity,
                    })

                  // Update stock levels reserved quantity
                  await serviceSupabase.rpc("increment_reserved", {
                    item_id: bomItem.inventory_item_id,
                    location_id: (
                      await serviceSupabase
                        .from("locations")
                        .select("id")
                        .eq("type", "workshop")
                        .single()
                    ).data?.id,
                    qty: bomItem.quantity,
                  })
                }
              }

              // Get labour costs
              const { data: labour } = await serviceSupabase
                .from("design_labour_costs")
                .select("*")
                .eq("design_id", item.design_id)
                .single()

              if (labour) {
                await serviceSupabase
                  .from("job_card_labour_snapshots")
                  .insert({
                    job_card_id: jobCard.id,
                    labour_data: labour,
                  })
              }
            }
          }

          jobCards.push(jobCard)
        }
      }
    }

    return NextResponse.json({
      message: "Order confirmed and job cards created",
      job_cards: jobCards,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to confirm order" },
      { status: 500 }
    )
  }
}

