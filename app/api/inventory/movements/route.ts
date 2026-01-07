import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const { data, error } = await supabase
      .from("stock_movements")
      .select(`
        *,
        inventory_items (
          name,
          sku
        ),
        locations (
          name
        )
      `)
      .order("timestamp", { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch stock movements" },
      { status: 500 }
    )
  }
}

