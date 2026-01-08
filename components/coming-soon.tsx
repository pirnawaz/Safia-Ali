"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface ComingSoonProps {
  title: string
  phase: string
  description: string
  bullets: string[]
}

export function ComingSoon({ title, phase, description, bullets }: ComingSoonProps) {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="border-2">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-base px-3 py-1">
              {phase}
            </Badge>
          </div>
          <CardTitle className="text-3xl md:text-4xl font-heading">{title}</CardTitle>
          <CardDescription className="text-base md:text-lg max-w-2xl mx-auto">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Planned Features:</h3>
            <ul className="space-y-2 list-disc list-inside">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="text-muted-foreground">
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center pt-4">
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
