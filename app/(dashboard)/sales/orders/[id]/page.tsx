"use client"

import { use } from "react"
import { ComingSoon } from "@/components/coming-soon"

const bullets = [
  "View order details with line items and customisations",
  "Edit order (if status allows)",
  "Confirm order to lock snapshot and generate job cards",
  "Track order status and production progress",
  "View customer order history"
]

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  
  return (
    <ComingSoon
      title={`Sales Order ${resolvedParams.id}`}
      phase="Phase 2"
      description="View and manage sales order details."
      bullets={bullets}
    />
  )
}
