"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LabourCosts {
  cutting_cost: number
  embroidery_type: string | null
  embroidery_cost: number
  stitching_cost: number
  finishing_cost: number
}

export default function LabourCostEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: labourCosts, isLoading } = useQuery<LabourCosts>({
    queryKey: ["labour", resolvedParams.id],
    queryFn: async () => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/labour`)
      if (!res.ok) {
        if (res.status === 404) return null
        throw new Error("Failed to fetch labour costs")
      }
      return res.json()
    },
  })

  const { register, handleSubmit, formState: { errors } } = useForm<LabourCosts>({
    defaultValues: labourCosts || {
      cutting_cost: 0,
      embroidery_cost: 0,
      stitching_cost: 0,
      finishing_cost: 0,
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: LabourCosts) => {
      const res = await fetch(`/api/designs/${resolvedParams.id}/labour`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save labour costs")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labour", resolvedParams.id] })
      alert("Labour costs saved successfully")
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  const onSubmit = (data: LabourCosts) => {
    saveMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Labour Costs Editor</h1>

      <Card>
        <CardHeader>
          <CardTitle>Labour Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="cutting_cost">Cutting Cost</Label>
              <Input
                id="cutting_cost"
                type="number"
                step="0.01"
                {...register("cutting_cost", { valueAsNumber: true })}
              />
            </div>

            <div>
              <Label htmlFor="embroidery_type">Embroidery Type</Label>
              <select
                id="embroidery_type"
                {...register("embroidery_type")}
                className="w-full p-2 border rounded"
              >
                <option value="">None</option>
                <option value="hand">Hand</option>
                <option value="machine">Machine</option>
                <option value="computer">Computer</option>
              </select>
            </div>

            <div>
              <Label htmlFor="embroidery_cost">Embroidery Cost</Label>
              <Input
                id="embroidery_cost"
                type="number"
                step="0.01"
                {...register("embroidery_cost", { valueAsNumber: true })}
              />
            </div>

            <div>
              <Label htmlFor="stitching_cost">Stitching Cost</Label>
              <Input
                id="stitching_cost"
                type="number"
                step="0.01"
                {...register("stitching_cost", { valueAsNumber: true })}
              />
            </div>

            <div>
              <Label htmlFor="finishing_cost">Finishing Cost</Label>
              <Input
                id="finishing_cost"
                type="number"
                step="0.01"
                {...register("finishing_cost", { valueAsNumber: true })}
              />
            </div>

            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Labour Costs"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

