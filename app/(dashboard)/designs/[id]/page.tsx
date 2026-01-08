"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatPKR, formatDateTime } from "@/lib/format"
import { designSchema, type DesignInput } from "@/lib/validations/design"
import { useAuth } from "@/hooks/useAuth"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { Loader2, Package, DollarSign, TrendingUp, AlertCircle } from "lucide-react"

export default function ProductOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { role } = useAuth()

  const { data: design, isLoading } = useQuery({
    queryKey: ["design", resolvedParams.id],
    queryFn: async () => {
      const res = await fetch(`/api/designs/${resolvedParams.id}`)
      if (!res.ok) throw new Error("Failed to fetch design")
      return res.json()
    },
  })

  const { data: costData } = useQuery({
    queryKey: ["design-cost", resolvedParams.id],
    queryFn: async () => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/compute-cost`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!design && (role === "admin" || role === "manager" || role === "accounts"),
  })

  const { data: bomCount } = useQuery({
    queryKey: ["bom-count", resolvedParams.id],
    queryFn: async () => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/bom`)
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: labourCount } = useQuery({
    queryKey: ["labour-count", resolvedParams.id],
    queryFn: async () => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/labour`)
      if (!res.ok) return []
      return res.json()
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<DesignInput>({
    resolver: zodResolver(designSchema),
    values: design
      ? {
          name: design.name,
          sku: design.sku,
          category: design.category || "",
          size_range: design.size_range || "",
          status: design.status || "draft",
          base_selling_price: design.base_selling_price,
          base_cost_price: design.base_cost_price || 0,
          active: design.active ?? true,
        }
      : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: DesignInput) => {
      const res = await fetch(`/api/designs/${resolvedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update product")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design", resolvedParams.id] })
      reset()
      alert("Product updated successfully")
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  const canEdit = role === "admin" || role === "manager"
  const canViewCost = role === "admin" || role === "manager" || role === "accounts"
  const totalLines = (bomCount?.length || 0) + (labourCount?.length || 0)

  const canMarkReady =
    design?.base_selling_price > 0 && totalLines >= 1

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!design) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Product not found</p>
        </CardContent>
      </Card>
    )
  }

  const onSubmit = (data: DesignInput) => {
    updateMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading">{design.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">SKU: {design.sku}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={design.status === "ready" ? "default" : "outline"}
            className={design.status === "ready" ? "bg-green-600" : ""}
          >
            {design.status === "ready" ? "Ready" : "Draft"}
          </Badge>
          <Link href="/designs">
            <Button variant="outline">Back to Products</Button>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bom">BOM</TabsTrigger>
          <TabsTrigger value="labour">Labour</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      disabled={!canEdit}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      {...register("sku")}
                      disabled={!canEdit}
                    />
                    {errors.sku && (
                      <p className="text-sm text-red-500 mt-1">{errors.sku.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      {...register("category")}
                      disabled={!canEdit}
                    />
                  </div>

                  <div>
                    <Label htmlFor="base_selling_price">Base Selling Price (PKR) *</Label>
                    <Input
                      id="base_selling_price"
                      type="number"
                      step="0.01"
                      {...register("base_selling_price", { valueAsNumber: true })}
                      disabled={!canEdit}
                    />
                    {errors.base_selling_price && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.base_selling_price.message}
                      </p>
                    )}
                  </div>

                  {canEdit && (
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        defaultValue={design.status || "draft"}
                        onValueChange={(value: "draft" | "ready") => {
                          handleSubmit((data) => {
                            updateMutation.mutate({ ...data, status: value })
                          })()
                        }}
                        disabled={!canMarkReady && design.status === "draft"}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="ready" disabled={!canMarkReady}>
                            Ready
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {!canMarkReady && design.status === "draft" && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Set selling price &gt; 0 and add at least one BOM or Labour line to mark as Ready
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {canEdit && (
                  <div className="flex gap-2">
                    <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                    {isDirty && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => reset()}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Selling Price</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPKR(design.base_selling_price)}
                </div>
              </CardContent>
            </Card>

            {canViewCost && costData && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Computed Cost</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPKR(costData.computedCost)}
                  </div>
                  {design.base_cost_price > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Saved: {formatPKR(design.base_cost_price)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {canViewCost && costData?.margin && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Margin</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPKR(costData.margin.grossMargin)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {costData.margin.grossMarginPct.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* BOM Tab */}
        <TabsContent value="bom">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Bill of Materials</h2>
              <Link href={`/designs/${resolvedParams.id}/bom`}>
                <Button>Manage BOM</Button>
              </Link>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  {bomCount?.length || 0} BOM line(s) defined. Click "Manage BOM" to add or edit.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Labour Tab */}
        <TabsContent value="labour">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Labour Costs</h2>
              <Link href={`/designs/${resolvedParams.id}/labour`}>
                <Button>Manage Labour</Button>
              </Link>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  {labourCount?.length || 0} labour line(s) defined. Click "Manage Labour" to add or edit.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cost Tab */}
        <TabsContent value="cost">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Cost Summary</h2>
              <Link href={`/designs/${resolvedParams.id}/cost`}>
                <Button>View Details</Button>
              </Link>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Click "View Details" to see complete cost breakdown and save as base COGS.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
