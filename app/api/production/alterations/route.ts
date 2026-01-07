import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient, createServiceRoleClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const { data, error } = await supabase
      .from("alterations")
      .select(`
        *,
        original_job_card:job_cards!alterations_original_job_card_id_fkey (
          job_number,
          customers (name)
        ),
        alteration_job_card:job_cards!alterations_alteration_job_card_id_fkey (
          job_number,
          current_stage
        )
      `)
      .order("requested_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch alterations" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient()
    const serviceSupabase = createServiceRoleClient()

    const body = await request.json()
    const {
      original_job_card_id,
      request_notes,
      request_photos,
      reset_stage,
    } = body

    if (!original_job_card_id) {
      return NextResponse.json(
        { error: "Original job card ID is required" },
        { status: 400 }
      )
    }

    // Get original job card
    const { data: originalJobCard, error: fetchError } = await serviceSupabase
      .from("job_cards")
      .select("*")
      .eq("id", original_job_card_id)
      .single()

    if (fetchError || !originalJobCard) {
      return NextResponse.json(
        { error: "Original job card not found" },
        { status: 404 }
      )
    }

    // Check if job card is in Ready or Delivered status
    if (
      !["ready", "delivered"].includes(originalJobCard.current_stage)
    ) {
      return NextResponse.json(
        { error: "Job card must be Ready or Delivered to create alteration" },
        { status: 400 }
      )
    }

    // Get count of existing alterations for this job card
    const { data: existingAlterations } = await serviceSupabase
      .from("alterations")
      .select("cycle_number")
      .eq("original_job_card_id", original_job_card_id)
      .order("cycle_number", { ascending: false })
      .limit(1)

    const cycleNumber = existingAlterations && existingAlterations.length > 0
      ? existingAlterations[0].cycle_number + 1
      : 1

    // Generate job number for alteration
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

    // Create alteration job card
    const { data: alterationJobCard, error: jobCardError } =
      await serviceSupabase
        .from("job_cards")
        .insert({
          job_number: jobNumber,
          sales_order_item_id: originalJobCard.sales_order_item_id,
          customer_id: originalJobCard.customer_id,
          design_id: originalJobCard.design_id,
          current_stage: reset_stage || "cutting",
          status: "active",
          estimated_cost: originalJobCard.estimated_cost,
        })
        .select()
        .single()

    if (jobCardError) throw jobCardError

    // Create alteration record
    const { data: alteration, error: alterationError } =
      await serviceSupabase
        .from("alterations")
        .insert({
          original_job_card_id,
          alteration_job_card_id: alterationJobCard.id,
          cycle_number: cycleNumber,
          request_notes: request_notes || null,
          request_photos: request_photos || null,
          requested_by: user.id,
        })
        .select()
        .single()

    if (alterationError) throw alterationError

    // Update original job card status
    await serviceSupabase
      .from("job_cards")
      .update({ current_stage: "alteration_requested" })
      .eq("id", original_job_card_id)

    return NextResponse.json(alteration, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create alteration" },
      { status: 500 }
    )
  }
}

