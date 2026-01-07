"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { designSchema, type DesignInput } from "@/lib/validations/design"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewDesignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DesignInput>({
    resolver: zodResolver(designSchema),
  })

  const onSubmit = async (data: DesignInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create design")
      }

      const design = await res.json()
      router.push(`/designs/${design.id}/edit`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">New Design</h1>

      <Card>
        <CardHeader>
          <CardTitle>Design Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Design name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                {...register("sku")}
                placeholder="DES-001"
              />
              {errors.sku && (
                <p className="text-sm text-red-500">{errors.sku.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                {...register("category")}
                placeholder="Evening Wear"
              />
            </div>

            <div>
              <Label htmlFor="size_range">Size Range</Label>
              <Input
                id="size_range"
                {...register("size_range")}
                placeholder="XS-XXL or Custom"
              />
            </div>

            <div>
              <Label htmlFor="base_selling_price">Base Selling Price *</Label>
              <Input
                id="base_selling_price"
                type="number"
                step="0.01"
                {...register("base_selling_price", { valueAsNumber: true })}
                placeholder="5000.00"
              />
              {errors.base_selling_price && (
                <p className="text-sm text-red-500">
                  {errors.base_selling_price.message}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Design"}
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

