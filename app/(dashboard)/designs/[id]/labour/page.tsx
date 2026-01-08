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
import { Textarea } from "@/components/ui/textarea"
import { formatPKR } from "@/lib/format"
import { labourLineSchema, type LabourLineInput } from "@/lib/validations/design"
import { useAuth } from "@/hooks/useAuth"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { Loader2, Plus, Trash2, Edit2, Save, X, Hammer } from "lucide-react"

interface LabourLine {
  id: string
  design_id: string
  labour_type: string
  rate: number
  qty: number
  notes: string | null
  sort_order: number
}

const LABOUR_TYPES = [
  "Cutting",
  "Embroidery",
  "Stitching",
  "Finishing",
  "Pressing",
  "Quality Check",
  "Packaging",
  "Other",
]

export default function LabourEditorPage({
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

  const { data: labourLines, isLoading } = useQuery<LabourLine[]>({
    queryKey: ["labour", resolvedParams.id],
    queryFn: async () => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/labour`)
      if (!res.ok) throw new Error("Failed to fetch labour lines")
      return res.json()
    },
  })

  const addMutation = useMutation({
    mutationFn: async (data: LabourLineInput) => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/labour`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to add labour line")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labour", resolvedParams.id] })
      queryClient.invalidateQueries({ queryKey: ["labour-count", resolvedParams.id] })
      setIsAdding(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LabourLineInput> }) => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/labour/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update labour line")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labour", resolvedParams.id] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/labour/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete labour line")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labour", resolvedParams.id] })
      queryClient.invalidateQueries({ queryKey: ["labour-count", resolvedParams.id] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const totalLabourCost =
    labourLines?.reduce((sum, line) => sum + line.rate * line.qty, 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading">Labour Costs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage labour steps and rates for this product
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && !isAdding && (
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          )}
          <Link href={`/designs/${resolvedParams.id}`}>
            <Button variant="outline">Back to Product</Button>
          </Link>
        </div>
      </div>

      {/* Add New Line Form */}
      {isAdding && canEdit && (
        <AddLabourLineForm
          onSubmit={(data) => {
            addMutation.mutate(data, {
              onError: (error: Error) => alert(error.message),
            })
          }}
          onCancel={() => setIsAdding(false)}
          isPending={addMutation.isPending}
        />
      )}

      {/* Labour Lines List */}
      <Card>
        <CardHeader>
          <CardTitle>Labour Steps ({labourLines?.length || 0} lines)</CardTitle>
        </CardHeader>
        <CardContent>
          {!labourLines || labourLines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Hammer className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No labour steps defined yet.</p>
              {canEdit && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Step
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {labourLines.map((line) =>
                editingId === line.id && canEdit ? (
                  <EditLabourLineForm
                    key={line.id}
                    line={line}
                    onSubmit={(data) => {
                      updateMutation.mutate(
                        { id: line.id, data },
                        {
                          onError: (error: Error) => alert(error.message),
                        }
                      )
                    }}
                    onCancel={() => setEditingId(null)}
                    isPending={updateMutation.isPending}
                  />
                ) : (
                  <LabourLineCard
                    key={line.id}
                    line={line}
                    onEdit={canEdit ? () => setEditingId(line.id) : undefined}
                    onDelete={
                      canEdit
                        ? () => {
                            if (confirm("Are you sure you want to delete this step?")) {
                              deleteMutation.mutate(line.id, {
                                onError: (error: Error) => alert(error.message),
                              })
                            }
                          }
                        : undefined
                    }
                    canViewCost={canViewCost}
                  />
                )
              )}
            </div>
          )}

          {/* Total */}
          {labourLines && labourLines.length > 0 && canViewCost && (
            <div className="mt-6 pt-6 border-t flex justify-between items-center">
              <span className="font-semibold text-lg">Labour Total</span>
              <span className="text-2xl font-bold">{formatPKR(totalLabourCost)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AddLabourLineForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (data: LabourLineInput) => void
  onCancel: () => void
  isPending: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LabourLineInput>({
    resolver: zodResolver(labourLineSchema),
    defaultValues: {
      labour_type: "",
      rate: 0,
      qty: 1,
      notes: null,
      sort_order: 0,
    },
  })

  const submitHandler = (data: LabourLineInput) => {
    onSubmit(data)
    reset()
  }

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle>Add Labour Step</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="labour_type">Labour Type *</Label>
              <select
                id="labour_type"
                {...register("labour_type")}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Select type</option>
                {LABOUR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.labour_type && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.labour_type.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rate">Rate (PKR) *</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  {...register("rate", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.rate && (
                  <p className="text-sm text-red-500 mt-1">{errors.rate.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="qty">Quantity *</Label>
                <Input
                  id="qty"
                  type="number"
                  step="0.01"
                  {...register("qty", { valueAsNumber: true })}
                  placeholder="1"
                />
                {errors.qty && (
                  <p className="text-sm text-red-500 mt-1">{errors.qty.message}</p>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Optional notes for this step..."
                rows={2}
              />
            </div>
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
                  Add Step
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

function EditLabourLineForm({
  line,
  onSubmit,
  onCancel,
  isPending,
}: {
  line: LabourLine
  onSubmit: (data: Partial<LabourLineInput>) => void
  onCancel: () => void
  isPending: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Partial<LabourLineInput>>({
    defaultValues: {
      labour_type: line.labour_type,
      rate: line.rate,
      qty: line.qty,
      notes: line.notes,
      sort_order: line.sort_order,
    },
  })

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle>Edit Labour Step</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="labour_type">Labour Type *</Label>
              <select
                id="labour_type"
                {...register("labour_type")}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Select type</option>
                {LABOUR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.labour_type && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.labour_type.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rate">Rate (PKR) *</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  {...register("rate", { valueAsNumber: true })}
                />
                {errors.rate && (
                  <p className="text-sm text-red-500 mt-1">{errors.rate.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="qty">Quantity *</Label>
                <Input
                  id="qty"
                  type="number"
                  step="0.01"
                  {...register("qty", { valueAsNumber: true })}
                />
                {errors.qty && (
                  <p className="text-sm text-red-500 mt-1">{errors.qty.message}</p>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                rows={2}
              />
            </div>
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

function LabourLineCard({
  line,
  onEdit,
  onDelete,
  canViewCost,
}: {
  line: LabourLine
  onEdit?: () => void
  onDelete?: () => void
  canViewCost: boolean
}) {
  const lineCost = line.rate * line.qty

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div>
              <p className="font-semibold">{line.labour_type}</p>
              {line.notes && (
                <p className="text-sm text-muted-foreground mt-1">{line.notes}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Rate: </span>
                <span className="font-medium">{formatPKR(line.rate)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Qty: </span>
                <span className="font-medium">{line.qty}</span>
              </div>
              {canViewCost && (
                <div>
                  <span className="text-muted-foreground">Step Cost: </span>
                  <span className="font-semibold">{formatPKR(lineCost)}</span>
                </div>
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
