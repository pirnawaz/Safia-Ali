"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SalesOrder {
  id: string
  order_number: string
  status: string
  total_amount: number
  tax_amount: number
  created_at: string
  customers: {
    name: string
  } | null
}

export default function SalesOrdersPage() {
  const { data: orders, isLoading } = useQuery<SalesOrder[]>({
    queryKey: ["sales-orders"],
    queryFn: async () => {
      const res = await fetch("/api/sales/orders")
      if (!res.ok) throw new Error("Failed to fetch orders")
      return res.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sales Orders</h1>
        <Link href="/sales/orders/new">
          <Button>New Order</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {orders?.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{order.order_number}</CardTitle>
                <span className={`px-2 py-1 rounded text-sm ${
                  order.status === "confirmed" ? "bg-green-100 text-green-800" :
                  order.status === "draft" ? "bg-gray-100 text-gray-800" :
                  "bg-blue-100 text-blue-800"
                }`}>
                  {order.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    Customer: {order.customers?.name || "Walk-in"}
                  </p>
                  <p className="text-sm font-semibold">
                    Total: ₹{order.total_amount.toFixed(2)}
                  </p>
                </div>
                <Link href={`/sales/orders/${order.id}`}>
                  <Button variant="outline">View</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

