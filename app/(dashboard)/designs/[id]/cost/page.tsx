"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPKR, formatDateTime } from "@/lib/format"
import { useAuth } from "@/hooks/useAuth"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { Loader2, Package, Hammer, DollarSign, TrendingUp, Save } from "lucide-react"

export default function CostSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { role } = useAuth()

  const { data: design, isLoading: designLoading } = useQuery({
    queryKey: ["design", resolvedParams.id],
    queryFn: async () => {
      const res = await fetch(`/api/designs/${resolvedParams.id}`)
      if (!res.ok) throw new Error("Failed to fetch design")
      return res.json()
    },
  })

  const { data: costData, isLoading: costLoading, refetch } = useQuery({
    queryKey: ["design-cost", resolvedParams.id],
    queryFn: async () => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/compute-cost`)
      if (!res.ok) throw new Error("Failed to compute cost")
      return res.json()
    },
    enabled: !!design && (role === "admin" || role === "manager" || role === "accounts"),
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/cost/save`, {
        method: "POST",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to save cost")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design", resolvedParams.id] })
      queryClient.invalidateQueries({ queryKey: ["design-cost", resolvedParams.id] })
      alert("Base COGS saved successfully")
      refetch()
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  const canViewCost = role === "admin" || role === "manager" || role === "accounts"
  const canSave = role === "admin" || role === "manager"

  if (designLoading || costLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!canViewCost) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            You don't have permission to view cost details.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!costData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Unable to compute cost. Please ensure BOM and Labour lines are defined.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading">Cost Summary</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {design?.name} ({design?.sku})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Recompute
          </Button>
          <Link href={`/designs/${resolvedParams.id}`}>
            <Button variant="outline">Back to Product</Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materials Cost</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPKR(costData.bom?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {costData.bom?.lines?.length || 0} line(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labour Cost</CardTitle>
            <Hammer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPKR(costData.labour?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {costData.labour?.lines?.length || 0} line(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total COGS</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPKR(costData.computedCost || 0)}
            </div>
            {design?.base_cost_price && design.base_cost_price > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Saved: {formatPKR(design.base_cost_price)}
                {design.cost_last_computed_at && (
                  <>
                    <br />
                    {formatDateTime(new Date(design.cost_last_computed_at))}
                  </>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Materials Breakdown */}
      {costData.bom?.lines && costData.bom.lines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Materials Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {costData.bom.lines.map((line: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{line.inventory_item_id || "Item"}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {line.quantity} {line.uom || ""}
                      {line.wastageMultiplier && line.wastageMultiplier > 1 && (
                        <> • Wastage: {((line.wastageMultiplier - 1) * 100).toFixed(1)}%</>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPKR(line.cost || 0)}</p>
                    {line.unitCost && (
                      <p className="text-xs text-muted-foreground">
                        @ {formatPKR(line.unitCost)}/unit
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="font-semibold">Materials Total</span>
              <span className="text-xl font-bold">{formatPKR(costData.bom.total)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Labour Breakdown */}
      {costData.labour?.lines && costData.labour.lines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Labour Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {costData.labour.lines.map((line: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{line.labour_type}</p>
                    <p className="text-sm text-muted-foreground">
                      Rate: {formatPKR(line.rate)} × Qty: {line.qty}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPKR(line.cost || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="font-semibold">Labour Total</span>
              <span className="text-xl font-bold">{formatPKR(costData.labour.total)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Margin Analysis */}
      {costData.margin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Margin Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Selling Price</p>
                <p className="text-2xl font-bold">{formatPKR(costData.margin.sellingPrice)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost Price</p>
                <p className="text-2xl font-bold">{formatPKR(costData.margin.cost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gross Margin</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPKR(costData.margin.grossMargin)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Margin %</p>
                <p className="text-2xl font-bold text-green-600">
                  {costData.margin.grossMarginPct.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {canSave && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Save as Base COGS</p>
                <p className="text-sm text-muted-foreground">
                  This will update the product's base_cost_price and create an audit record.
                </p>
              </div>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                size="lg"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Base COGS
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
