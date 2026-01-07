"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

export default function EditDesignPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()

  const { data: design, isLoading } = useQuery({
    queryKey: ["design", resolvedParams.id],
    queryFn: async () => {
      const res = await fetch(`/api/designs/${resolvedParams.id}`)
      if (!res.ok) throw new Error("Failed to fetch design")
      return res.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!design) {
    return <div>Design not found</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Design: {design.name}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Design Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>SKU:</strong> {design.sku}</p>
              <p><strong>Category:</strong> {design.category || "N/A"}</p>
              <p><strong>Size Range:</strong> {design.size_range || "N/A"}</p>
              <p><strong>Selling Price:</strong> {formatCurrency(design.base_selling_price)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/designs/${resolvedParams.id}/bom`} className="block">
              <Button className="w-full">Edit BOM</Button>
            </Link>
            <Link href={`/designs/${resolvedParams.id}/labour`} className="block">
              <Button className="w-full" variant="outline">
                Edit Labour Costs
              </Button>
            </Link>
            <Button
              className="w-full"
              variant="outline"
              onClick={async () => {
                const res = await fetch(
                  `/api/designs/${resolvedParams.id}/compute-cost`,
                  { method: "POST" }
                )
                if (res.ok) {
                  alert("Cost computed successfully")
                  router.refresh()
                }
              }}
            >
              Compute Cost
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

