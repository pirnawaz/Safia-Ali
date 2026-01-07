"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface JobCard {
  id: string
  job_number: string
  current_stage: string
  priority: string
  due_date: string | null
  customers: { name: string } | null
  designs: { name: string } | null
}

export default function JobCardsPage() {
  const { data: jobCards, isLoading } = useQuery<JobCard[]>({
    queryKey: ["job-cards"],
    queryFn: async () => {
      const res = await fetch("/api/production/job-cards")
      if (!res.ok) throw new Error("Failed to fetch job cards")
      return res.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Job Cards</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobCards?.map((card) => (
          <Card key={card.id}>
            <CardHeader>
              <CardTitle>{card.job_number}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Customer: {card.customers?.name || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  Design: {card.designs?.name || "N/A"}
                </p>
                <p className="text-sm">
                  Stage: <span className="font-semibold">{card.current_stage}</span>
                </p>
                {card.due_date && (
                  <p className="text-sm text-red-600">
                    Due: {new Date(card.due_date).toLocaleDateString()}
                  </p>
                )}
                <Link href={`/production/job-cards/${card.id}`}>
                  <Button variant="outline" className="w-full mt-2">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

