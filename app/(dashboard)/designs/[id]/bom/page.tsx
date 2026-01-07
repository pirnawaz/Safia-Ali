"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BOMItem {
  id: string
  inventory_item_id: string
  quantity: number
  uom: string
  inventory_items: {
    id: string
    sku: string
    name: string
    weighted_avg_cost: number
  }
}

export default function BOMEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [items, setItems] = useState<Array<{
    inventory_item_id: string
    quantity: number
    uom: string
  }>>([])

  const { data: bom, isLoading } = useQuery<BOMItem[]>({
    queryKey: ["bom", resolvedParams.id],
    queryFn: async () => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/bom`)
      if (!res.ok) throw new Error("Failed to fetch BOM")
      return res.json()
    },
  })

  const { data: inventoryItems } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory")
      if (!res.ok) throw new Error("Failed to fetch inventory")
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: { items: typeof items }) => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/bom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save BOM")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bom", resolvedParams.id] })
      alert("BOM saved successfully")
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">BOM Editor</h1>

      <Card>
        <CardHeader>
          <CardTitle>Bill of Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bom?.map((item) => (
              <div key={item.id} className="border p-4 rounded">
                <p><strong>{item.inventory_items.name}</strong> ({item.inventory_items.sku})</p>
                <p>Quantity: {item.quantity} {item.uom}</p>
                <p>Cost: ₹{(item.quantity * item.inventory_items.weighted_avg_cost).toFixed(2)}</p>
              </div>
            ))}

            <Button
              onClick={() => {
                if (bom) {
                  saveMutation.mutate({
                    items: bom.map((item) => ({
                      inventory_item_id: item.inventory_item_id,
                      quantity: item.quantity,
                      uom: item.uom,
                    })),
                  })
                }
              }}
              disabled={saveMutation.isPending}
            >
              Save BOM
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

