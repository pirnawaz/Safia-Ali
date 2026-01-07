import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { generateInvoicePDF } from "@/lib/pdf/invoice"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const { data: order, error } = await supabase
      .from("sales_orders")
      .select(`
        *,
        customers (*),
        sales_order_items (
          *,
          designs (
            name
          )
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) throw error

    const invoiceData = {
      order_number: order.order_number,
      customer: order.customers
        ? {
            name: order.customers.name,
            email: order.customers.email || undefined,
            phone: order.customers.phone || undefined,
            address: order.customers.address || undefined,
          }
        : null,
      items: order.sales_order_items.map((item: any) => ({
        design_name: item.designs?.name || "Custom Item",
        quantity: item.quantity,
        base_price: item.base_price,
        customisation_delta: item.customisation_delta,
        discount: item.discount,
        tax_rate: item.tax_rate,
        total:
          (item.base_price + item.customisation_delta - item.discount) *
          item.quantity *
          (1 + item.tax_rate / 100),
      })),
      total_amount: order.total_amount,
      tax_amount: order.tax_amount,
      created_at: order.created_at,
    }

    const pdfBuffer = await generateInvoicePDF(invoiceData)

    // Save invoice record
    const { data: lastInvoice } = await supabase
      .from("invoices")
      .select("invoice_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    let invoiceNumber = "INV-0001"
    if (lastInvoice?.invoice_number) {
      const lastNum = parseInt(lastInvoice.invoice_number.split("-")[1])
      invoiceNumber = `INV-${String(lastNum + 1).padStart(4, "0")}`
    }

    // In a real app, you'd upload the PDF to Supabase Storage
    // For now, we'll just return it
    await supabase.from("invoices").insert({
      sales_order_id: params.id,
      invoice_number: invoiceNumber,
    })

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoiceNumber}.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate invoice" },
      { status: 500 }
    )
  }
}

