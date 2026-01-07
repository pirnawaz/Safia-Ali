"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
}

export default function CustomersPage() {
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers")
      if (!res.ok) throw new Error("Failed to fetch customers")
      return res.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Link href="/customers/new">
          <Button>New Customer</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customers?.map((customer) => (
          <Card key={customer.id}>
            <CardHeader>
              <CardTitle>{customer.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customer.phone && (
                  <p className="text-sm text-gray-600">Phone: {customer.phone}</p>
                )}
                {customer.email && (
                  <p className="text-sm text-gray-600">Email: {customer.email}</p>
                )}
                {customer.address && (
                  <p className="text-sm text-gray-600">
                    Address: {customer.address}
                  </p>
                )}
                {customer.notes && (
                  <p className="text-sm text-gray-500 italic">
                    Notes: {customer.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

