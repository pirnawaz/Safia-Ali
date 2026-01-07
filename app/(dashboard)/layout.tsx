import { redirect } from "next/navigation"
import { createServerComponentClient } from "@/lib/supabase/server"
import AppSidebar from "@/components/layout/AppSidebar"

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerComponentClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen md:flex bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}

