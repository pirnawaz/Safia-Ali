"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { UserRole } from "@/lib/auth/roles"

interface UserProfile {
  id: string
  role_id: string
  full_name: string | null
  phone: string | null
  user_roles: {
    name: UserRole
  } | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*, user_roles(name)")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error loading profile:", error)
      setProfile(null)
    } else {
      setProfile(data as UserProfile)
    }
    setLoading(false)
  }

  const role: UserRole | null = profile?.user_roles?.name ?? null

  return {
    user,
    profile,
    role,
    loading,
  }
}

