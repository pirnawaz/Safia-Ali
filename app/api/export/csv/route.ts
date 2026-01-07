import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createServerComponentClient()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // orders, customers, inventory

    if (!type) {
      return NextResponse.json(
        { error: "Type parameter is required" },
        { status: 400 }
      )
    }

    let data: any[] = []
    let filename = "export.csv"

    if (type === "orders") {
      const { data: orders } = await supabase
        .from("sales_orders")
        .select(`
          *,
          customers (name, email)
        `)
      data = orders || []
      filename = "orders.csv"
    } else if (type === "customers") {
      const { data: customers } = await supabase.from("customers").select("*")
      data = customers || []
      filename = "customers.csv"
    } else if (type === "inventory") {
      const { data: items } = await supabase
        .from("inventory_items")
        .select("*")
      data = items || []
      filename = "inventory.csv"
    }

    // Convert to CSV
    if (data.length === 0) {
      return NextResponse.json({ error: "No data to export" }, { status: 400 })
    }

    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (value === null || value === undefined) return ""
            if (typeof value === "object") return JSON.stringify(value)
            return String(value).replace(/"/g, '""')
          })
          .join(",")
      ),
    ]

    const csv = csvRows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to export CSV" },
      { status: 500 }
    )
  }
}

