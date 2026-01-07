"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import type { UserRole } from "@/lib/auth/roles"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
        return
      }

      if (requiredRole && role !== requiredRole) {
        router.push("/dashboard")
        return
      }
    }
  }, [user, role, loading, requiredRole, router])

  if (loading) {
    return fallback ?? <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  if (requiredRole && role !== requiredRole) {
    return null
  }

  return <>{children}</>
}

