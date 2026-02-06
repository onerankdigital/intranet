"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authApi, apiClient } from "@/lib/api"

interface User {
  id: string
  name: string
  email: string
  is_admin: boolean | string  // Can be boolean or string "true"/"false" from API
  status: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const logout = useCallback(() => {
    apiClient.setToken(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    }
    setUser(null)
    router.push("/login")
  }, [router])

  const checkAuth = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      apiClient.setToken(token)
      const response = await authApi.me()

      // Check if response has data and it's not an error
      if (response.data && !response.error) {
        setUser(response.data as User)
      } else if (response.error) {
        // Only clear token if there's an actual error (like 401)
        console.error("Auth check error:", response.error)
        apiClient.setToken(null)
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
        }
        setUser(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      // Don't clear token on network errors, only on auth errors
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Token expiration check removed - tokens now persist indefinitely until explicit logout

  // Set up API client unauthorized callback
  useEffect(() => {
    apiClient.setOnUnauthorized(() => {
      logout()
    })
  }, [logout])

  useEffect(() => {
    checkAuth()
    // Token expiration checking removed - tokens persist until explicit logout
  }, [])

  const login = async (email: string, password: string) => {
    try {
      interface TokenResponse {
        access_token: string
        refresh_token: string
        token_type?: string
      }

      const response = await authApi.login({ email, password })
      
      if (response.error) {
        return { success: false, error: response.error }
      }

      const data = response.data as TokenResponse | undefined
      if (data?.access_token) {
        apiClient.setToken(data.access_token)
        if (data.refresh_token && typeof window !== "undefined") {
          localStorage.setItem("refresh_token", data.refresh_token)
        }
        
        // Fetch user profile
        const userResponse = await authApi.me()
        if (userResponse.data) {
          setUser(userResponse.data as User)
          return { success: true }
        }
      }
      
      return { success: false, error: "Login failed" }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Login failed" 
      }
    }
  }


  // Protect routes - redirect to login if not authenticated
  useEffect(() => {
    if (!loading) {
      const publicPaths = ["/login"]
      const isPublicPath = publicPaths.includes(pathname)
      
      if (!user && !isPublicPath) {
        router.push("/login")
      } else if (user && pathname === "/login") {
        router.push("/")
      }
    }
  }, [user, loading, pathname, router])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

