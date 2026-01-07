import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const { data, error } = await supabase
      .from("job_cards")
      .select(`
        *,
        customers (*),
        designs (*),
        sales_order_items (
          *,
          sales_orders (
            order_number
          )
        ),
        job_card_stage_history (
          *,
          changed_by_user:auth.users!job_card_stage_history_changed_by_fkey (
            email
          )
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch job card" },
      { status: 500 }
    )
  }
}

