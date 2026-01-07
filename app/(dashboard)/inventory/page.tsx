"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

interface InventoryItem {
  id: string
  sku: string
  name: string
  category: string | null
  uom: string
  reorder_level: number
  weighted_avg_cost: number
  active: boolean
}

export default function InventoryPage() {
  const { data: items, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory")
      if (!res.ok) throw new Error("Failed to fetch inventory")
      return res.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Items</h1>
        <Link href="/inventory/new">
          <Button>New Item</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items?.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                <p className="text-sm text-gray-600">
                  Category: {item.category || "N/A"}
                </p>
                <p className="text-sm text-gray-600">UOM: {item.uom}</p>
                <p className="text-sm font-semibold">
                  Avg Cost: {formatCurrency(item.weighted_avg_cost)}
                </p>
                <p className="text-sm text-gray-600">
                  Reorder Level: {item.reorder_level}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

