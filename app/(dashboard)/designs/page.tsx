"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { formatCurrency } from "@/lib/format"

interface Design {
  id: string
  name: string
  sku: string
  category: string | null
  status: string
  base_selling_price: number
  base_cost_price: number
  active: boolean
}

export default function DesignsPage() {
  const { data: designs, isLoading } = useQuery<Design[]>({
    queryKey: ["designs"],
    queryFn: async () => {
      const res = await fetch("/api/designs")
      if (!res.ok) throw new Error("Failed to fetch designs")
      return res.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage product designs and costs</p>
        </div>
        <Link href="/designs/new">
          <Button>New Product</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {designs?.map((design) => (
          <Card key={design.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{design.name}</CardTitle>
                {design.status === "ready" && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Ready
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">SKU: {design.sku}</p>
                <p className="text-sm text-muted-foreground">
                  Category: {design.category || "N/A"}
                </p>
                <p className="text-base font-semibold">
                  Selling Price: {formatCurrency(design.base_selling_price)}
                </p>
                <PermissionGate permission="viewCostPrice">
                  {design.base_cost_price > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Cost Price: {formatCurrency(design.base_cost_price)}
                    </p>
                  )}
                </PermissionGate>
                <div className="flex gap-2 mt-4">
                  <Link href={`/designs/${design.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!designs || designs.length === 0) && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No products found</p>
              <Link href="/designs/new">
                <Button>Create First Product</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

