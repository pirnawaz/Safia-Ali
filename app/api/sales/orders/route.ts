import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { salesOrderSchema } from "@/lib/validations/sales"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const { data, error } = await supabase
      .from("sales_orders")
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch sales orders" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient()

    const body = await request.json()
    const validated = salesOrderSchema.parse(body)

    // Generate order number
    const { data: lastOrder } = await supabase
      .from("sales_orders")
      .select("order_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    let orderNumber = "SO-0001"
    if (lastOrder?.order_number) {
      const lastNum = parseInt(lastOrder.order_number.split("-")[1])
      orderNumber = `SO-${String(lastNum + 1).padStart(4, "0")}`
    }

    // Calculate totals
    let totalAmount = 0
    let taxAmount = 0

    for (const item of validated.items) {
      const itemTotal = (item.base_price + item.customisation_delta - item.discount) * item.quantity
      const itemTax = itemTotal * (item.tax_rate / 100)
      totalAmount += itemTotal
      taxAmount += itemTax
    }

    // Create sales order
    const { data: order, error: orderError } = await supabase
      .from("sales_orders")
      .insert({
        order_number: orderNumber,
        customer_id: validated.customer_id || null,
        status: "draft",
        total_amount: totalAmount,
        tax_amount: taxAmount,
        created_by: user.id,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create sales order items
    const orderItems = validated.items.map((item) => ({
      sales_order_id: order.id,
      ...item,
      delivery_date_estimate: item.delivery_date_estimate
        ? new Date(item.delivery_date_estimate).toISOString()
        : null,
    }))

    const { data: items, error: itemsError } = await supabase
      .from("sales_order_items")
      .insert(orderItems)
      .select()

    if (itemsError) throw itemsError

    return NextResponse.json(
      { ...order, items },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Failed to create sales order" },
      { status: 500 }
    )
  }
}

