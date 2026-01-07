"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"

interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  created_at: string
  user_roles: {
    id: string
    name: string
    description: string
  } | null
}

interface Role {
  id: string
  name: string
  description: string
}

export default function AdminUsersPage() {
  const { user: currentUser, role: currentRole } = useAuth()
  const queryClient = useQueryClient()
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({})

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
    enabled: currentRole === "admin",
  })

  // Fetch roles
  const { data: roles } = useQuery<Role[]>({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const res = await fetch("/api/admin/roles")
      if (!res.ok) throw new Error("Failed to fetch roles")
      return res.json()
    },
    enabled: currentRole === "admin",
  })

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_name: roleName }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update role")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      alert("Role updated successfully")
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  const handleRoleChange = (userId: string, roleName: string) => {
    setSelectedRoles((prev) => ({ ...prev, [userId]: roleName }))
  }

  const handleUpdateRole = (userId: string) => {
    const roleName = selectedRoles[userId]
    if (!roleName) return

    if (confirm("Are you sure you want to change this user's role?")) {
      updateRoleMutation.mutate({ userId, roleName })
    }
  }

  if (currentRole !== "admin") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Access Denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (usersLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p>Loading users...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage user roles and permissions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">Email</th>
                  <th className="text-left p-3 font-semibold">Current Role</th>
                  <th className="text-left p-3 font-semibold">New Role</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => {
                  const isCurrentUser = user.id === currentUser?.id
                  const currentRoleName = user.user_roles?.name || "No role"

                  return (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{user.full_name || "No name"}</p>
                          <p className="text-sm text-gray-600 md:hidden">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <p className="text-sm">{user.email}</p>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {currentRoleName}
                        </span>
                      </td>
                      <td className="p-3">
                        {isCurrentUser ? (
                          <span className="text-sm text-gray-500">Cannot edit own role</span>
                        ) : (
                          <Select
                            value={selectedRoles[user.id] || currentRoleName}
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                            disabled={isCurrentUser}
                          >
                            <SelectTrigger className="w-full max-w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles?.map((role) => (
                                <SelectItem key={role.id} value={role.name}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className="p-3">
                        {!isCurrentUser && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateRole(user.id)}
                            disabled={
                              !selectedRoles[user.id] ||
                              selectedRoles[user.id] === currentRoleName ||
                              updateRoleMutation.isPending
                            }
                          >
                            Update
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {(!users || users.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h3>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>You cannot change your own role</li>
            <li>All role changes are logged in the audit log</li>
            <li>Admin role has full system access</li>
            <li>Manager and Accounts roles can view cost prices</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

