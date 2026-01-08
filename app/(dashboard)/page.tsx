"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { formatCurrency } from "@/lib/format"

export default function DashboardPage() {
  // Placeholder queries - these would fetch real data
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // This would be replaced with actual API calls
      return {
        ordersToday: 12,
        revenue: 45000,
        activeJobs: 28,
        lowStock: 5,
      }
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome to Safia Ali ERP System
        </p>
      </div>

      {/* KPI Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orders Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{stats?.ordersToday || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">+2 from yesterday</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              {formatCurrency(stats?.revenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">+15% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Job Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{stats?.activeJobs || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">In production</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-destructive">
              {stats?.lowStock || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Needs reorder</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Link href="/pos" className="block">
          <Card className="p-6 cursor-pointer border-border bg-card card-hover">
            <div className="font-heading text-lg">New Order</div>
            <p className="mt-1 text-sm text-muted-foreground">Create a new sales order</p>
          </Card>
        </Link>

        <Link href="/customers/new" className="block">
          <Card className="p-6 cursor-pointer border-border bg-card card-hover">
            <div className="font-heading text-lg">New Customer</div>
            <p className="mt-1 text-sm text-muted-foreground">Add a new customer</p>
          </Card>
        </Link>

        <Link href="/production/board" className="block">
          <Card className="p-6 cursor-pointer border-border bg-card card-hover">
            <div className="font-heading text-lg">Production Board</div>
            <p className="mt-1 text-sm text-muted-foreground">View job card status</p>
          </Card>
        </Link>
      </div>

      {/* Recent Activity Placeholder */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-heading">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Activity feed coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
