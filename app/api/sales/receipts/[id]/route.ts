import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { generateReceiptPDF } from "@/lib/pdf/receipt"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const { data: payment, error } = await supabase
      .from("payments")
      .select(`
        *,
        sales_orders (
          order_number,
          customers (
            name
          )
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) throw error

    const receiptData = {
      receipt_number: payment.receipt_number,
      order_number: (payment.sales_orders as any).order_number,
      customer: (payment.sales_orders as any).customers
        ? { name: (payment.sales_orders as any).customers.name }
        : null,
      amount: payment.amount,
      method: payment.method,
      created_at: payment.created_at,
    }

    const pdfBuffer = await generateReceiptPDF(receiptData)

    // Save receipt record
    await supabase.from("receipts").insert({
      payment_id: params.id,
      receipt_number: payment.receipt_number,
    })

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${payment.receipt_number}.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate receipt" },
      { status: 500 }
    )
  }
}

