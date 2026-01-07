"use client"

import { use } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const STAGES = [
  "fabric_procurement",
  "dyeing",
  "cutting",
  "embroidery",
  "stitching",
  "finishing_qa",
  "ready",
  "dispatched",
  "delivered",
]

export default function JobCardDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const queryClient = useQueryClient()

  const { data: jobCard, isLoading } = useQuery({
    queryKey: ["job-card", resolvedParams.id],
    queryFn: async () => {
      const res = await fetch(`/api/production/job-cards/${resolvedParams.id}`)
      if (!res.ok) throw new Error("Failed to fetch job card")
      return res.json()
    },
  })

  const updateStageMutation = useMutation({
    mutationFn: async (newStage: string) => {
      const res = await fetch(
        `/api/production/job-cards/${resolvedParams.id}/stage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to_stage: newStage }),
        }
      )
      if (!res.ok) throw new Error("Failed to update stage")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["job-card", resolvedParams.id],
      })
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!jobCard) {
    return <div>Job card not found</div>
  }

  const currentStageIndex = STAGES.indexOf(jobCard.current_stage)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Job Card: {jobCard.job_number}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Customer:</strong> {jobCard.customers?.name || "N/A"}</p>
            <p><strong>Design:</strong> {jobCard.designs?.name || "N/A"}</p>
            <p><strong>Current Stage:</strong> {jobCard.current_stage}</p>
            <p><strong>Priority:</strong> {jobCard.priority}</p>
            {jobCard.due_date && (
              <p><strong>Due Date:</strong> {new Date(jobCard.due_date).toLocaleDateString()}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stage Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentStageIndex > 0 && (
              <Button
                onClick={() => {
                  updateStageMutation.mutate(STAGES[currentStageIndex - 1])
                }}
                disabled={updateStageMutation.isPending}
                className="w-full"
              >
                Move to Previous Stage
              </Button>
            )}
            {currentStageIndex < STAGES.length - 1 && (
              <Button
                onClick={() => {
                  updateStageMutation.mutate(STAGES[currentStageIndex + 1])
                }}
                disabled={updateStageMutation.isPending}
                className="w-full"
                variant="outline"
              >
                Move to Next Stage
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {jobCard.job_card_stage_history && (
        <Card>
          <CardHeader>
            <CardTitle>Stage History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {jobCard.job_card_stage_history.map((history: any) => (
                <div key={history.id} className="border p-2 rounded">
                  <p className="text-sm">
                    {history.from_stage} → {history.to_stage}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(history.changed_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

