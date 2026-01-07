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

    const { data: order, error: orderError } = await supabase
      .from("sales_orders")
      .select(`
        *,
        customers (*),
        sales_order_items (
          *,
          designs (
            id,
            name,
            sku
          )
        ),
        payments (*)
      `)
      .eq("id", params.id)
      .single()

    if (orderError) throw orderError

    return NextResponse.json(order)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch sales order" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const body = await request.json()

    const { data, error } = await supabase
      .from("sales_orders")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update sales order" },
      { status: 500 }
    )
  }
}

