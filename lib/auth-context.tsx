"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authApi, apiClient } from "@/lib/api"

interface User {
  id: string
  email: string
  is_admin: boolean
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
      
      if (response.data) {
        setUser(response.data)
      } else {
        // Token invalid, clear it
        apiClient.setToken(null)
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
        }
        setUser(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
      apiClient.setToken(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
      }
    } finally {
      setLoading(false)
    }
  }

  // Helper function to decode JWT token and check expiration
  const checkTokenExpiration = (token: string): boolean => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      const decoded = JSON.parse(jsonPayload)
      const exp = decoded.exp
      if (exp) {
        const expirationTime = exp * 1000 // Convert to milliseconds
        const now = Date.now()
        return now >= expirationTime
      }
      return false
    } catch (error) {
      console.error('Error decoding token:', error)
      return true // Assume expired if can't decode
    }
  }

  // Function to check if token is expired and logout if needed
  const validateTokenExpiration = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const token = localStorage.getItem('access_token')
    if (token && checkTokenExpiration(token)) {
      // Token expired, logout
      logout()
    }
  }, [logout])

  // Set up API client unauthorized callback
  useEffect(() => {
    apiClient.setOnUnauthorized(() => {
      logout()
    })
  }, [logout])

  useEffect(() => {
    checkAuth()
    
    // Check token expiration on mount
    validateTokenExpiration()
    
    // Check token expiration every minute
    const intervalId = setInterval(() => {
      validateTokenExpiration()
    }, 60000) // Check every minute
    
    // Calculate time until next midnight
    const now = new Date()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0) // Next midnight
    const msUntilMidnight = midnight.getTime() - now.getTime()
    
    // Set a timeout to check at midnight
    const midnightTimeout = setTimeout(() => {
      validateTokenExpiration()
      // Then check every minute after midnight
      const midnightInterval = setInterval(() => {
        validateTokenExpiration()
      }, 60000)
      // Clear interval after 1 hour (tokens typically expire at midnight)
      setTimeout(() => {
        clearInterval(midnightInterval)
      }, 3600000) // 1 hour
    }, msUntilMidnight)
    
    return () => {
      clearInterval(intervalId)
      clearTimeout(midnightTimeout)
    }
  }, [validateTokenExpiration])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password })
      
      if (response.error) {
        return { success: false, error: response.error }
      }

      const { access_token, refresh_token } = response.data || {}
      if (access_token) {
        apiClient.setToken(access_token)
        if (refresh_token && typeof window !== "undefined") {
          localStorage.setItem("refresh_token", refresh_token)
        }
        
        // Fetch user profile
        const userResponse = await authApi.me()
        if (userResponse.data) {
          setUser(userResponse.data)
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

