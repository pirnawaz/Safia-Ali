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
        <h1 className="text-3xl font-bold">Designs</h1>
        <Link href="/designs/new">
          <Button>New Design</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {designs?.map((design) => (
          <Card key={design.id}>
            <CardHeader>
              <CardTitle>{design.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">SKU: {design.sku}</p>
                <p className="text-sm text-gray-600">
                  Category: {design.category || "N/A"}
                </p>
                <p className="text-sm font-semibold">
                  Selling Price: {formatCurrency(design.base_selling_price)}
                </p>
                <PermissionGate permission="viewCostPrice">
                  <p className="text-sm text-gray-500">
                    Cost Price: {formatCurrency(design.base_cost_price)}
                  </p>
                </PermissionGate>
                <div className="flex gap-2 mt-4">
                  <Link href={`/designs/${design.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/designs/${design.id}/bom`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      BOM
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

