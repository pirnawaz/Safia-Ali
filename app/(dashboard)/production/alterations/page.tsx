"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Alteration {
  id: string
  cycle_number: number
  request_notes: string | null
  requested_at: string
  original_job_card: {
    job_number: string
    customers: { name: string } | null
  }
  alteration_job_card: {
    job_number: string
    current_stage: string
  }
}

export default function AlterationsPage() {
  const { data: alterations, isLoading } = useQuery<Alteration[]>({
    queryKey: ["alterations"],
    queryFn: async () => {
      const res = await fetch("/api/production/alterations")
      if (!res.ok) throw new Error("Failed to fetch alterations")
      return res.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Alterations</h1>
        <Link href="/production/alterations/new">
          <Button>New Alteration Request</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {alterations?.map((alteration) => (
          <Card key={alteration.id}>
            <CardHeader>
              <CardTitle>
                Alteration Cycle #{alteration.cycle_number}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Original:</strong> {alteration.original_job_card.job_number}
                </p>
                <p className="text-sm">
                  <strong>Alteration:</strong> {alteration.alteration_job_card.job_number}
                </p>
                <p className="text-sm">
                  <strong>Stage:</strong> {alteration.alteration_job_card.current_stage}
                </p>
                {alteration.request_notes && (
                  <p className="text-sm text-gray-600">
                    Notes: {alteration.request_notes}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Requested: {new Date(alteration.requested_at).toLocaleString()}
                </p>
                <Link href={`/production/alterations/${alteration.id}`}>
                  <Button variant="outline" className="mt-2">
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

