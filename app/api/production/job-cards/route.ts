import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const { data, error } = await supabase
      .from("job_cards")
      .select(`
        *,
        customers (
          name,
          phone,
          email
        ),
        designs (
          name,
          sku
        ),
        sales_order_items (
          sales_orders (
            order_number
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch job cards" },
      { status: 500 }
    )
  }
}

