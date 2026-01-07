import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    // Get WIP by stage
    const { data: jobCards, error } = await supabase
      .from("job_cards")
      .select("current_stage, status")
      .eq("status", "active")

    if (error) throw error

    const wipByStage: Record<string, number> = {}
    jobCards.forEach((jc) => {
      wipByStage[jc.current_stage] = (wipByStage[jc.current_stage] || 0) + 1
    })

    // Get late jobs
    const { data: lateJobs } = await supabase
      .from("job_cards")
      .select("*")
      .eq("status", "active")
      .lt("due_date", new Date().toISOString())

    // Get alteration count
    const { data: alterations } = await supabase
      .from("alterations")
      .select("id")

    return NextResponse.json({
      wip_by_stage: wipByStage,
      late_jobs_count: lateJobs?.length || 0,
      alteration_count: alterations?.length || 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate production report" },
      { status: 500 }
    )
  }
}

