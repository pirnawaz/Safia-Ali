import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient, createServiceRoleClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient()
    const serviceSupabase = createServiceRoleClient()

    // Get Shopify settings
    const { data: settings, error: settingsError } = await serviceSupabase
      .from("shopify_settings")
      .select("*")
      .single()

    if (settingsError || !settings?.active || !settings.access_token) {
      return NextResponse.json(
        { error: "Shopify integration not configured" },
        { status: 400 }
      )
    }

    // Fetch orders from Shopify
    const shopifyUrl = `https://${settings.store_url}/admin/api/2024-01/orders.json?status=any&limit=250`
    const shopifyResponse = await fetch(shopifyUrl, {
      headers: {
        "X-Shopify-Access-Token": settings.access_token,
      },
    })

    if (!shopifyResponse.ok) {
      throw new Error("Failed to fetch orders from Shopify")
    }

    const shopifyData = await shopifyResponse.json()
    const orders = shopifyData.orders || []

    let processed = 0
    const errors: any[] = []

    // Process each order
    for (const order of orders) {
      try {
        // Check if order already exists
        const { data: existingOrder } = await serviceSupabase
          .from("sales_orders")
          .select("id")
          .eq("order_number", `SHOPIFY-${order.order_number}`)
          .single()

        if (existingOrder) {
          continue // Skip if already imported
        }

        // Create or find customer
        let customerId = null
        if (order.customer) {
          const { data: existingCustomer } = await serviceSupabase
            .from("customers")
            .select("id")
            .eq("email", order.customer.email)
            .single()

          if (existingCustomer) {
            customerId = existingCustomer.id
          } else {
            const { data: newCustomer } = await serviceSupabase
              .from("customers")
              .insert({
                name: `${order.customer.first_name} ${order.customer.last_name}`,
                email: order.customer.email,
                phone: order.customer.phone,
              })
              .select()
              .single()

            if (newCustomer) customerId = newCustomer.id
          }
        }

        // Generate order number
        const orderNumber = `SHOPIFY-${order.order_number}`

        // Calculate totals
        const totalAmount = parseFloat(order.total_price || "0")
        const taxAmount = parseFloat(order.total_tax || "0")

        // Create sales order
        const { data: salesOrder, error: orderError } = await serviceSupabase
          .from("sales_orders")
          .insert({
            order_number: orderNumber,
            customer_id: customerId,
            status: "draft",
            total_amount: totalAmount,
            tax_amount: taxAmount,
            created_by: user.id,
          })
          .select()
          .single()

        if (orderError) throw orderError

        // Create order items
        for (const lineItem of order.line_items || []) {
          // Find design by Shopify SKU mapping
          const { data: mapping } = await serviceSupabase
            .from("shopify_sku_mappings")
            .select("internal_design_sku")
            .eq("shopify_sku", lineItem.sku)
            .single()

          const designSku = mapping?.internal_design_sku

          let designId = null
          if (designSku) {
            const { data: design } = await serviceSupabase
              .from("designs")
              .select("id")
              .eq("sku", designSku)
              .single()

            if (design) designId = design.id
          }

          await serviceSupabase.from("sales_order_items").insert({
            sales_order_id: salesOrder.id,
            design_id: designId,
            quantity: lineItem.quantity,
            base_price: parseFloat(lineItem.price || "0"),
            requires_job_card: true, // Shopify orders are made-to-order
          })
        }

        processed++
      } catch (error: any) {
        errors.push({
          order_number: order.order_number,
          error: error.message,
        })
      }
    }

    // Log sync
    await serviceSupabase.from("shopify_sync_logs").insert({
      sync_type: "orders",
      status: errors.length > 0 ? "partial" : "success",
      records_processed: processed,
      errors: errors.length > 0 ? errors : null,
      synced_by: user.id,
    })

    return NextResponse.json({
      message: "Sync completed",
      processed,
      errors: errors.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to sync orders" },
      { status: 500 }
    )
  }
}

