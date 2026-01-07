"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface InventoryItem {
  id: string
  sku: string
  name: string
  reorder_level: number
  stock_levels: Array<{
    quantity: number
    reserved_quantity: number
    locations: { name: string }
  }>
}

export default function InventoryDashboardPage() {
  const { data: items, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["inventory-with-stock"],
    queryFn: async () => {
      const res = await fetch("/api/inventory")
      if (!res.ok) throw new Error("Failed to fetch inventory")
      const items = await res.json()

      // Fetch stock levels for each item
      const itemsWithStock = await Promise.all(
        items.map(async (item: any) => {
          const stockRes = await fetch(
            `/api/inventory/${item.id}/stock-levels`
          )
          const stockLevels = stockRes.ok ? await stockRes.json() : []
          return { ...item, stock_levels: stockLevels }
        })
      )

      return itemsWithStock
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  const lowStockItems = items?.filter((item) => {
    const totalStock = item.stock_levels.reduce(
      (sum, sl) => sum + sl.quantity,
      0
    )
    return totalStock <= item.reorder_level
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Inventory Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockItems && lowStockItems.length > 0 ? (
            <div className="space-y-2">
              {lowStockItems.map((item) => {
                const totalStock = item.stock_levels.reduce(
                  (sum, sl) => sum + sl.quantity,
                  0
                )
                return (
                  <div
                    key={item.id}
                    className="border p-3 rounded bg-red-50 border-red-200"
                  >
                    <p className="font-semibold">{item.name} ({item.sku})</p>
                    <p className="text-sm text-red-600">
                      Current Stock: {totalStock} | Reorder Level:{" "}
                      {item.reorder_level}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500">No low stock items</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

