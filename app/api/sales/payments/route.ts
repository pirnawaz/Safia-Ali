import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"
import { paymentSchema } from "@/lib/validations/sales"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient()

    const body = await request.json()
    const validated = paymentSchema.parse(body)

    // Generate receipt number
    const { data: lastReceipt } = await supabase
      .from("payments")
      .select("receipt_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    let receiptNumber = "RCP-0001"
    if (lastReceipt?.receipt_number) {
      const lastNum = parseInt(lastReceipt.receipt_number.split("-")[1])
      receiptNumber = `RCP-${String(lastNum + 1).padStart(4, "0")}`
    }

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        ...validated,
        receipt_number: receiptNumber,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 500 }
    )
  }
}

