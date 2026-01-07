import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const groupBy = searchParams.get("group_by") || "day"

    let query = supabase
      .from("sales_orders")
      .select("*")
      .eq("status", "closed")

    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data: orders, error } = await query

    if (error) throw error

    // Group and aggregate
    const report = {
      total_orders: orders.length,
      total_amount: orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
      total_tax: orders.reduce((sum, o) => sum + parseFloat(o.tax_amount || 0), 0),
      by_date: {} as Record<string, { count: number; amount: number }>,
    }

    orders.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split("T")[0]
      if (!report.by_date[date]) {
        report.by_date[date] = { count: 0, amount: 0 }
      }
      report.by_date[date].count++
      report.by_date[date].amount += parseFloat(order.total_amount || 0)
    })

    return NextResponse.json(report)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate sales report" },
      { status: 500 }
    )
  }
}

