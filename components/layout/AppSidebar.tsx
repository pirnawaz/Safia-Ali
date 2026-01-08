"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Menu, LogOut, User, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { NAV_ITEMS, type UserRole } from "@/lib/rbac-nav";
import RoleBadge from "@/components/ui/role-badge";
import SidebarHeaderSkeleton from "@/components/layout/SidebarHeaderSkeleton";

import { createClientComponentClient } from "@/lib/supabase/client";

type UserInfo = { email: string; role: UserRole };

function SidebarContent({
  user,
  loading,
  collapsed = false,
  onNavigate,
  onLogout,
}: {
  user: UserInfo | null;
  loading: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  const nav = useMemo(() => {
    if (!user) return [];
    return NAV_ITEMS.filter((i) => i.roles.includes(user.role));
  }, [user]);

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="mb-5">
        {collapsed ? (
          <div className="font-heading text-xl tracking-wide text-center">SA</div>
        ) : (
          <>
            <div className="font-heading text-xl tracking-wide">Safia Ali ERP</div>
            <div className="mt-1 text-xs text-muted-foreground">Pakistan</div>
          </>
        )}
        <div className="mt-3 h-px bg-border" />
      </div>

      {/* Profile */}
      {!collapsed && (
        <div className="mb-4">
          {loading ? (
            <SidebarHeaderSkeleton />
          ) : (
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {user?.email ?? "—"}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {user?.role ? <RoleBadge role={user.role} /> : null}
                  </div>
                </div>
              </div>

              <Button
                className="mt-3 w-full justify-start"
                variant="outline"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      )}
      {collapsed && (
        <div className="mb-4">
          {!loading && (
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full border border-border bg-card p-2">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={onLogout}
                className="h-9 w-9"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "relative rounded-md px-3 py-2 text-sm transition",
                "hover:bg-muted flex items-center gap-2",
                active && "bg-muted font-medium",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              {/* gold active indicator */}
              {active ? (
                <span className={cn(
                  "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-[hsl(var(--accent))]",
                  collapsed && "hidden"
                )} />
              ) : null}
              {collapsed ? (
                <span className="text-lg">{item.label.charAt(0)}</span>
              ) : (
                <span className="pl-2">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mt-4 text-xs text-muted-foreground">
          Pakistan locale (PKR • Asia/Karachi)
        </div>
      )}
    </div>
  );
}

export default function AppSidebar() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      const u = data.user;

      if (!u) {
        if (!ignore) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // Fetch role from user_profiles table
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*, user_roles(name)")
        .eq("id", u.id)
        .single();

      const role = (profile?.user_roles?.name ?? "staff") as UserRole;

      if (!ignore) {
        setUser({ email: u.email ?? "", role });
        setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-background">
            <SidebarContent
              user={user}
              loading={loading}
              onLogout={handleLogout}
            />
          </SheetContent>
        </Sheet>

        <div className="font-heading text-sm tracking-wide">Safia Ali ERP</div>
        <div className="w-10" />
      </div>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex md:flex-col md:border-r md:border-border md:bg-background md:p-4 relative transition-all duration-300",
        collapsed ? "md:w-16" : "md:w-72"
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border border-border bg-background hover:bg-muted"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        <SidebarContent 
          user={user} 
          loading={loading} 
          collapsed={collapsed}
          onLogout={handleLogout} 
        />
      </aside>
    </>
  );
}

