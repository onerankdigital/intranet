"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { usePermissions } from "@/lib/use-permissions"
import {
  LayoutDashboard,
  Users,
  FileText,
  Webhook,
  Menu,
  X,
  LogOut,
  User,
  Shield,
  Key,
  UserCheck,
  Network,
  Package,
  Activity,
  Receipt,
  FileEdit,
} from "lucide-react"
import { Button } from "./button"
import { Badge } from "./badge"

interface SidebarProps {
  className?: string
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, module: null }, // Always visible
  { name: "Auth", href: "/auth", icon: User, module: "Auth" },
  { name: "Clients", href: "/clients", icon: Users, module: "Clients" },
  { name: "Transactions", href: "/transactions", icon: Receipt, module: "Transactions" },
  { name: "API Keys", href: "/api-keys", icon: Key, module: "API Keys" },
  { name: "Leads", href: "/leads", icon: FileText, module: "Leads" },
  { name: "Webhooks", href: "/webhooks", icon: Webhook, module: "Webhooks" },
  { name: "Roles", href: "/roles", icon: Shield, module: "Roles" },
  { name: "Permissions", href: "/permissions", icon: Key, module: "Permissions" },
  { name: "Role Permissions", href: "/role-permissions", icon: Shield, module: "Roles" },
  { name: "User-Clients", href: "/user-clients", icon: UserCheck, module: "User Clients" },
  { name: "Hierarchy", href: "/hierarchy", icon: Network, module: "Hierarchy" },
  { name: "Products", href: "/products", icon: Package, module: "Products" },
  { name: "Content", href: "/content", icon: FileEdit, module: "Content" },
]

export function Sidebar({ className }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const { canRead, hasPermission, loading: permissionsLoading } = usePermissions()

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Lead Platform
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              // Dashboard is always visible
              if (!item.module) {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:translate-x-1"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              }
              
              // Admin users can see everything
              // Handle both boolean and string values for is_admin
              const isAdmin = user?.is_admin === true || user?.is_admin === "true" || user?.is_admin === "True"
              if (isAdmin) {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:translate-x-1"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              }
              
              // For non-admin users, check permissions
              // Wait for permissions to load before showing/hiding items
              if (permissionsLoading) {
                // Show skeleton or nothing while loading
                return null
              }
              
              // Check if user has READ permission for this module
              // If no permissions at all, don't show anything (except Dashboard)
              const hasAccess = canRead(item.module)
              
              // Debug logging
              if (process.env.NODE_ENV === 'development') {
                console.log(`Sidebar check for ${item.name} (${item.module}):`, {
                  hasAccess,
                  permissionsLoading,
                  isAdmin: user?.is_admin
                })
              }
              
              // Don't render if no access
              if (!hasAccess) {
                return null
              }
              
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:translate-x-1"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2 bg-muted/30">
            {user && (
              <div className="px-3 py-2.5 rounded-lg bg-background/50 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium text-sm">{user.email}</p>
                </div>
                {(user.is_admin === true || user.is_admin === "true" || user.is_admin === "True") && (
                  <Badge variant="default" className="text-xs mt-1">
                    Admin
                  </Badge>
                )}
              </div>
            )}
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

