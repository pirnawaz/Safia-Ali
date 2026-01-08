"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { PHASES, type PhaseStatus } from "@/lib/roadmap"
import { formatDateTime } from "@/lib/format"
import { CheckCircle2, Clock, ArrowRight } from "lucide-react"

function StatusBadge({ status }: { status: PhaseStatus }) {
  if (status === "done") {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Done
      </Badge>
    )
  }
  if (status === "in_progress") {
    return (
      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
        <Clock className="h-3 w-3 mr-1" />
        In Progress
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Coming Soon
    </Badge>
  )
}

export default function RoadmapPage() {
  const completedCount = PHASES.filter((p) => p.status === "done").length
  const totalPhases = PHASES.length
  const progressPercent = (completedCount / totalPhases) * 100

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-heading">Implementation Roadmap</h1>
        <p className="text-muted-foreground text-lg">
          Safia Ali ERP rollout plan (Pakistan)
        </p>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            Completed: {completedCount}/{totalPhases} phases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {progressPercent.toFixed(0)}% complete
          </p>
        </CardContent>
      </Card>

      {/* Phase Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {PHASES.map((phase) => (
          <Card key={phase.phase} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      Phase {phase.phase}
                    </Badge>
                    <StatusBadge status={phase.status} />
                  </div>
                  <CardTitle className="text-xl">{phase.title}</CardTitle>
                </div>
              </div>
              <CardDescription className="text-base">
                {phase.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-3">Features:</h3>
                <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
                  {phase.bullets.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              </div>
              <Link href={phase.link}>
                <Button 
                  variant={phase.status === "done" ? "default" : "outline"} 
                  className="w-full"
                  disabled={phase.status === "coming_soon"}
                >
                  {phase.status === "done" || phase.status === "in_progress" ? (
                    <>
                      Open Module
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    "Coming Soon"
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-4 border-t">
        Last updated: {formatDateTime(new Date())}
      </div>
    </div>
  )
}
