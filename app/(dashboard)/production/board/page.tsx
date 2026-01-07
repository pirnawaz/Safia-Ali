"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface JobCard {
  id: string
  job_number: string
  current_stage: string
  priority: string
  due_date: string | null
  customers: { name: string } | null
  designs: { name: string } | null
  sales_order_items: {
    sales_orders: { order_number: string }
  } | null
}

const STAGES = [
  { key: "fabric_procurement", label: "Fabric Procurement" },
  { key: "dyeing", label: "Dyeing" },
  { key: "cutting", label: "Cutting" },
  { key: "embroidery", label: "Embroidery" },
  { key: "stitching", label: "Stitching" },
  { key: "finishing_qa", label: "Finishing/QA" },
  { key: "ready", label: "Ready" },
  { key: "dispatched", label: "Dispatched" },
  { key: "delivered", label: "Delivered" },
]

export default function ProductionBoardPage() {
  const queryClient = useQueryClient()

  const { data: jobCards, isLoading } = useQuery<JobCard[]>({
    queryKey: ["job-cards"],
    queryFn: async () => {
      const res = await fetch("/api/production/job-cards")
      if (!res.ok) throw new Error("Failed to fetch job cards")
      return res.json()
    },
  })

  const updateStageMutation = useMutation({
    mutationFn: async ({
      jobCardId,
      newStage,
    }: {
      jobCardId: string
      newStage: string
    }) => {
      const res = await fetch(`/api/production/job-cards/${jobCardId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_stage: newStage }),
      })
      if (!res.ok) throw new Error("Failed to update stage")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-cards"] })
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  const getJobCardsByStage = (stage: string) => {
    return jobCards?.filter((jc) => jc.current_stage === stage) || []
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Production Board</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
        {STAGES.map((stage) => {
          const cards = getJobCardsByStage(stage.key)
          return (
            <div key={stage.key} className="min-w-[200px]">
              <h2 className="font-semibold mb-2 sticky top-0 bg-white py-2">
                {stage.label} ({cards.length})
              </h2>
              <div className="space-y-2">
                {cards.map((card) => (
                  <Card key={card.id} className="cursor-pointer hover:shadow-md">
                    <CardContent className="p-3">
                      <p className="font-semibold text-sm">{card.job_number}</p>
                      <p className="text-xs text-gray-600">
                        {card.customers?.name || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {card.designs?.name || "N/A"}
                      </p>
                      {card.due_date && (
                        <p className="text-xs text-red-600 mt-1">
                          Due: {new Date(card.due_date).toLocaleDateString()}
                        </p>
                      )}
                      <div className="mt-2 flex gap-1">
                        {STAGES.findIndex((s) => s.key === stage.key) > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              const prevStage =
                                STAGES[
                                  STAGES.findIndex((s) => s.key === stage.key) - 1
                                ]
                              updateStageMutation.mutate({
                                jobCardId: card.id,
                                newStage: prevStage.key,
                              })
                            }}
                          >
                            ←
                          </Button>
                        )}
                        {STAGES.findIndex((s) => s.key === stage.key) <
                          STAGES.length - 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              const nextStage =
                                STAGES[
                                  STAGES.findIndex((s) => s.key === stage.key) + 1
                                ]
                              updateStageMutation.mutate({
                                jobCardId: card.id,
                                newStage: nextStage.key,
                              })
                            }}
                          >
                            →
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

