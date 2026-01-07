import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"

const STAGES = [
  "fabric_procurement",
  "dyeing",
  "cutting",
  "embroidery",
  "stitching",
  "finishing_qa",
  "ready",
  "dispatched",
  "delivered",
  "alteration_requested",
]

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient()

    const body = await request.json()
    const { to_stage, notes } = body

    if (!to_stage || !STAGES.includes(to_stage)) {
      return NextResponse.json(
        { error: "Invalid stage" },
        { status: 400 }
      )
    }

    // Get current job card
    const { data: jobCard, error: fetchError } = await supabase
      .from("job_cards")
      .select("current_stage")
      .eq("id", params.id)
      .single()

    if (fetchError) throw fetchError

    // Update stage
    const { error: updateError } = await supabase
      .from("job_cards")
      .update({
        current_stage: to_stage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (updateError) throw updateError

    // Log stage history
    await supabase.from("job_card_stage_history").insert({
      job_card_id: params.id,
      from_stage: jobCard.current_stage,
      to_stage: to_stage,
      changed_by: user.id,
      notes: notes || null,
    })

    return NextResponse.json({ message: "Stage updated successfully" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update stage" },
      { status: 500 }
    )
  }
}

