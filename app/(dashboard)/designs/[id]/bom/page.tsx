"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatPKR } from "@/lib/format"
import { bomItemSchema, type BOMItemInput } from "@/lib/validations/design"
import { useAuth } from "@/hooks/useAuth"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { Loader2, Plus, Trash2, Edit2, Save, X } from "lucide-react"

interface BOMItem {
  id: string
  inventory_item_id: string
  quantity: number
  uom: string
  wastage_pct: number
  cost_override: number | null
  sort_order: number
  inventory_items: {
    id: string
    sku: string
    name: string
    weighted_avg_cost?: number
  }
}

interface InventoryItem {
  id: string
  sku: string
  name: string
  uom: string
  weighted_avg_cost?: number
}

export default function BOMEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { role } = useAuth()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const canEdit = role === "admin" || role === "manager"
  const canViewCost = role === "admin" || role === "manager" || role === "accounts"

  const { data: bom, isLoading } = useQuery<BOMItem[]>({
    queryKey: ["bom", resolvedParams.id],
    queryFn: async () => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/bom`)
      if (!res.ok) throw new Error("Failed to fetch BOM")
      return res.json()
    },
  })

  const { data: inventoryItems } = useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory")
      if (!res.ok) throw new Error("Failed to fetch inventory")
      return res.json()
    },
  })

  const addMutation = useMutation({
    mutationFn: async (data: BOMItemInput) => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/bom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to add BOM line")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bom", resolvedParams.id] })
      queryClient.invalidateQueries({ queryKey: ["bom-count", resolvedParams.id] })
      setIsAdding(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BOMItemInput> }) => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/bom/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update BOM line")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bom", resolvedParams.id] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/bom/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete BOM line")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bom", resolvedParams.id] })
      queryClient.invalidateQueries({ queryKey: ["bom-count", resolvedParams.id] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const calculateLineCost = (item: BOMItem) => {
    const unitCost = item.cost_override ?? item.inventory_items?.weighted_avg_cost ?? 0
    const wastageMultiplier = 1 + (item.wastage_pct ?? 0) / 100
    return item.quantity * wastageMultiplier * unitCost
  }

  const totalMaterialsCost = bom?.reduce((sum, item) => sum + calculateLineCost(item), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading">Bill of Materials</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage materials and quantities for this product
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && !isAdding && (
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </Button>
          )}
          <Link href={`/designs/${resolvedParams.id}`}>
            <Button variant="outline">Back to Product</Button>
          </Link>
        </div>
      </div>

      {/* Add New Line Form */}
      {isAdding && canEdit && (
        <AddBOMLineForm
          designId={resolvedParams.id}
          inventoryItems={inventoryItems || []}
          onSubmit={(data) => {
            addMutation.mutate(data, {
              onError: (error: Error) => alert(error.message),
            })
          }}
          onCancel={() => setIsAdding(false)}
          isPending={addMutation.isPending}
        />
      )}

      {/* BOM Lines List */}
      <Card>
        <CardHeader>
          <CardTitle>Materials ({bom?.length || 0} lines)</CardTitle>
        </CardHeader>
        <CardContent>
          {!bom || bom.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No BOM lines defined yet.</p>
              {canEdit && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Line
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {bom.map((item) =>
                editingId === item.id && canEdit ? (
                  <EditBOMLineForm
                    key={item.id}
                    item={item}
                    inventoryItems={inventoryItems || []}
                    onSubmit={(data) => {
                      updateMutation.mutate(
                        { id: item.id, data },
                        {
                          onError: (error: Error) => alert(error.message),
                        }
                      )
                    }}
                    onCancel={() => setEditingId(null)}
                    isPending={updateMutation.isPending}
                    canViewCost={canViewCost}
                  />
                ) : (
                  <BOMLineCard
                    key={item.id}
                    item={item}
                    onEdit={canEdit ? () => setEditingId(item.id) : undefined}
                    onDelete={
                      canEdit
                        ? () => {
                            if (confirm("Are you sure you want to delete this line?")) {
                              deleteMutation.mutate(item.id, {
                                onError: (error: Error) => alert(error.message),
                              })
                            }
                          }
                        : undefined
                    }
                    canViewCost={canViewCost}
                    calculateCost={calculateLineCost}
                  />
                )
              )}
            </div>
          )}

          {/* Total */}
          {bom && bom.length > 0 && canViewCost && (
            <div className="mt-6 pt-6 border-t flex justify-between items-center">
              <span className="font-semibold text-lg">Materials Total</span>
              <span className="text-2xl font-bold">{formatPKR(totalMaterialsCost)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AddBOMLineForm({
  designId,
  inventoryItems,
  onSubmit,
  onCancel,
  isPending,
}: {
  designId: string
  inventoryItems: InventoryItem[]
  onSubmit: (data: BOMItemInput) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [selectedItemId, setSelectedItemId] = useState<string>("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BOMItemInput>({
    resolver: zodResolver(bomItemSchema),
    defaultValues: {
      quantity: 1,
      uom: "",
      wastage_pct: 0,
      cost_override: null,
      sort_order: 0,
    },
  })

  const selectedItem = inventoryItems.find((item) => item.id === selectedItemId)

  const submitHandler = (data: BOMItemInput) => {
    if (!selectedItemId) {
      alert("Please select an inventory item")
      return
    }
    onSubmit({ ...data, inventory_item_id: selectedItemId })
    reset()
    setSelectedItemId("")
  }

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle>Add BOM Line</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="inventory_item_id">Inventory Item *</Label>
              <Select
                value={selectedItemId}
                onValueChange={(value) => {
                  setSelectedItemId(value)
                  const item = inventoryItems.find((i) => i.id === value)
                  if (item) {
                    setValue("uom", item.uom)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedItemId && (
                <p className="text-sm text-red-500 mt-1">
                  Please select an inventory item
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                {...register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="uom">Unit of Measure *</Label>
              <Input
                id="uom"
                {...register("uom")}
                placeholder={selectedItem?.uom || "m, yd, pcs"}
              />
              {errors.uom && (
                <p className="text-sm text-red-500 mt-1">{errors.uom.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="wastage_pct">Wastage %</Label>
              <Input
                id="wastage_pct"
                type="number"
                step="0.01"
                {...register("wastage_pct", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <PermissionGate permission="viewCostPrice">
              <div>
                <Label htmlFor="cost_override">Cost Override (PKR)</Label>
                <Input
                  id="cost_override"
                  type="number"
                  step="0.01"
                  {...register("cost_override", {
                    valueAsNumber: true,
                    setValueAs: (v) => (v === "" ? null : v),
                  })}
                  placeholder={selectedItem?.weighted_avg_cost?.toString() || "Auto"}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default: {selectedItem?.weighted_avg_cost ? formatPKR(selectedItem.weighted_avg_cost) : "N/A"}
                </p>
              </div>
            </PermissionGate>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Add Line
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function EditBOMLineForm({
  item,
  inventoryItems,
  onSubmit,
  onCancel,
  isPending,
  canViewCost,
}: {
  item: BOMItem
  inventoryItems: InventoryItem[]
  onSubmit: (data: Partial<BOMItemInput>) => void
  onCancel: () => void
  isPending: boolean
  canViewCost: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Partial<BOMItemInput>>({
    defaultValues: {
      quantity: item.quantity,
      uom: item.uom,
      wastage_pct: item.wastage_pct ?? 0,
      cost_override: item.cost_override,
      sort_order: item.sort_order,
    },
  })

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle>Edit BOM Line</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Item</Label>
              <Input value={item.inventory_items.name} disabled />
              <p className="text-xs text-muted-foreground mt-1">{item.inventory_items.sku}</p>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                {...register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="uom">Unit of Measure *</Label>
              <Input id="uom" {...register("uom")} />
              {errors.uom && (
                <p className="text-sm text-red-500 mt-1">{errors.uom.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="wastage_pct">Wastage %</Label>
              <Input
                id="wastage_pct"
                type="number"
                step="0.01"
                {...register("wastage_pct", { valueAsNumber: true })}
              />
            </div>

            {canViewCost && (
              <div>
                <Label htmlFor="cost_override">Cost Override (PKR)</Label>
                <Input
                  id="cost_override"
                  type="number"
                  step="0.01"
                  {...register("cost_override", {
                    valueAsNumber: true,
                    setValueAs: (v) => (v === "" ? null : v),
                  })}
                  placeholder={item.inventory_items.weighted_avg_cost?.toString() || "Auto"}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function BOMLineCard({
  item,
  onEdit,
  onDelete,
  canViewCost,
  calculateCost,
}: {
  item: BOMItem
  onEdit?: () => void
  onDelete?: () => void
  canViewCost: boolean
  calculateCost: (item: BOMItem) => number
}) {
  const unitCost = item.cost_override ?? item.inventory_items?.weighted_avg_cost ?? 0
  const lineCost = calculateCost(item)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div>
              <p className="font-semibold">{item.inventory_items.name}</p>
              <p className="text-sm text-muted-foreground">{item.inventory_items.sku}</p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Qty: </span>
                <span className="font-medium">{item.quantity} {item.uom}</span>
              </div>
              {item.wastage_pct > 0 && (
                <div>
                  <span className="text-muted-foreground">Wastage: </span>
                  <span className="font-medium">{item.wastage_pct}%</span>
                </div>
              )}
              {canViewCost && (
                <>
                  <div>
                    <span className="text-muted-foreground">Unit Cost: </span>
                    <span className="font-medium">{formatPKR(unitCost)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Line Cost: </span>
                    <span className="font-semibold">{formatPKR(lineCost)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <Button size="sm" variant="outline" onClick={onEdit}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button size="sm" variant="destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
