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
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="p-6">
            <p>Loading production board...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getJobCardsByStage = (stage: string) => {
    return jobCards?.filter((jc) => jc.current_stage === stage) || []
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Production Board</h1>
        <p className="text-sm text-gray-600 mt-1">
          Track job cards through production stages
        </p>
      </div>

      {/* Horizontal scroll container for Kanban on small screens */}
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-4 px-4 md:px-0 min-w-max md:min-w-0">
          {STAGES.map((stage) => {
            const cards = getJobCardsByStage(stage.key)
            return (
              <div key={stage.key} className="w-[280px] md:w-auto shrink-0">
                <div className="sticky top-0 bg-white py-2 border-b mb-2 z-10">
                  <h2 className="font-semibold text-sm md:text-base">
                    {stage.label}
                  </h2>
                  <p className="text-xs text-gray-500">{cards.length} cards</p>
                </div>
                <div className="space-y-2 pb-4">
                  {cards.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No cards
                    </div>
                  ) : (
                    cards.map((card) => (
                      <Card key={card.id} className="cursor-pointer hover:shadow-md transition-shadow touch-manipulation">
                        <CardContent className="p-3">
                          <p className="font-semibold text-sm">{card.job_number}</p>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {card.customers?.name || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {card.designs?.name || "N/A"}
                          </p>
                          {card.due_date && (
                            <p className="text-xs text-red-600 mt-1">
                              Due: {new Date(card.due_date).toLocaleDateString()}
                            </p>
                          )}
                          <div className="mt-3 flex gap-2">
                            {STAGES.findIndex((s) => s.key === stage.key) > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8 px-3 touch-manipulation flex-1"
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
                                disabled={updateStageMutation.isPending}
                              >
                                ← Back
                              </Button>
                            )}
                            {STAGES.findIndex((s) => s.key === stage.key) <
                              STAGES.length - 1 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8 px-3 touch-manipulation flex-1"
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
                                disabled={updateStageMutation.isPending}
                              >
                                Next →
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile hint */}
      <div className="md:hidden bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          💡 Tip: Swipe horizontally to view all production stages
        </p>
      </div>
    </div>
  )
}

