"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { inventoryItemSchema, type InventoryItemInput } from "@/lib/validations/inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewInventoryItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InventoryItemInput>({
    resolver: zodResolver(inventoryItemSchema),
  })

  const onSubmit = async (data: InventoryItemInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create inventory item")
      }

      router.push("/inventory")
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">New Inventory Item</h1>

      <Card>
        <CardHeader>
          <CardTitle>Item Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                {...register("sku")}
                placeholder="FAB-001"
              />
              {errors.sku && (
                <p className="text-sm text-red-500">{errors.sku.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Item name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                {...register("category")}
                placeholder="Fabric"
              />
            </div>

            <div>
              <Label htmlFor="uom">Unit of Measure *</Label>
              <Input
                id="uom"
                {...register("uom")}
                placeholder="meters, pieces, kg, etc."
              />
              {errors.uom && (
                <p className="text-sm text-red-500">{errors.uom.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                type="number"
                step="0.01"
                {...register("reorder_level", { valueAsNumber: true })}
                placeholder="50"
              />
            </div>

            <div>
              <Label htmlFor="weighted_avg_cost">Weighted Average Cost</Label>
              <Input
                id="weighted_avg_cost"
                type="number"
                step="0.01"
                {...register("weighted_avg_cost", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Item"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

