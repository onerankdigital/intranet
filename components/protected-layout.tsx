"use client"

import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/ui/sidebar"

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth()
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Login page - no sidebar
  if (isLoginPage) {
    return <>{children}</>
  }

  // Protected pages - show sidebar
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6 lg:p-8 pt-20 lg:pt-6 relative z-10">
          {children}
        </main>
      </div>
    )
  }

  // Not authenticated and not on login page - will be redirected by AuthProvider
  return null
}

