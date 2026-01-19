"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { authApi } from "@/lib/api"

// Module definitions for grouping permissions
export const PERMISSION_MODULES = {
  AUTH: {
    name: "Auth",
    prefix: "/api/auth",
    description: "User authentication and management"
  },
  CLIENTS: {
    name: "Clients",
    prefix: "/api/clients",
    description: "Client management"
  },
  TRANSACTIONS: {
    name: "Transactions",
    prefix: "/api/transactions",
    description: "Transaction management"
  },
  LEADS: {
    name: "Leads",
    prefix: "/api/leads",
    description: "Lead management"
  },
  PRODUCTS: {
    name: "Products",
    prefix: "/api/products",
    description: "Product management"
  },
  ROLES: {
    name: "Roles",
    prefix: "/api/roles",
    description: "Role management"
  },
  PERMISSIONS: {
    name: "Permissions",
    prefix: "/api/permissions",
    description: "Permission management"
  },
  USER_CLIENTS: {
    name: "User Clients",
    prefix: "/api/user-clients",
    description: "User-Client assignment"
  },
  HIERARCHY: {
    name: "Hierarchy",
    prefix: "/api/hierarchy",
    description: "Organizational hierarchy"
  },
  API_KEYS: {
    name: "API Keys",
    prefix: "/api/api-keys",
    description: "API key management"
  },
  CONTENT: {
    name: "Content",
    prefix: "/api/about-us",
    description: "Content management"
  },
  INDUSTRIES: {
    name: "Industries",
    prefix: "/api/industries",
    description: "Industry management"
  },
  CATEGORIES: {
    name: "Categories",
    prefix: "/api/product-categories",
    description: "Product category management"
  },
  WEBHOOKS: {
    name: "Webhooks",
    prefix: "/webhook",
    description: "Webhook management"
  }
}

export interface Permission {
  id: string
  method: string
  path: string
  description?: string
}

export interface UserPermissionsHook {
  permissions: Permission[]
  loading: boolean
  hasPermission: (method: string, path: string) => boolean
  hasAnyPermission: (method: string, paths: string[]) => boolean
  canCreate: (module: string) => boolean
  canRead: (module: string) => boolean
  canUpdate: (module: string) => boolean
  canDelete: (module: string) => boolean
}

/**
 * Hook to get and check user permissions
 * Fetches permissions for the current user's role(s)
 */
export function usePermissions(): UserPermissionsHook {
  const { user, isAuthenticated } = useAuth()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!isAuthenticated || !user) {
        setPermissions([])
        setLoading(false)
        return
      }

      // Admin has all permissions
      if (user.is_admin === true) {
        setPermissions([])
        setLoading(false)
        return
      }

      // Fetch permissions for non-admin users
      setLoading(true)
      try {
        console.log("Fetching user permissions...")
        const response = await authApi.getMyPermissions()
        console.log("Permissions API response:", response)
        if (response.data && (response.data as any).permissions) {
          console.log("Setting permissions:", (response.data as any).permissions)
          setPermissions((response.data as any).permissions)
        } else {
          console.warn("No permissions in response, setting empty array")
          setPermissions([])
        }
      } catch (error) {
        console.error("Failed to fetch permissions:", error)
        setPermissions([])
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [user, isAuthenticated])

  const hasPermission = useCallback((method: string, path: string): boolean => {
    if (!user) return false
    if (user.is_admin === true) return true // Admin has all permissions

    if (permissions.length === 0) {
      // No permissions = no access (unless admin)
      return false
    }

    // Normalize path for matching (convert IDs to {id})
    // First, try exact match
    const exactMatch = permissions.some(
      (perm) => perm.method.toUpperCase() === method.toUpperCase() && perm.path === path
    )
    if (exactMatch) return true
    
    // Try normalized path matching
    const normalizedPath = path.replace(/\/[a-f0-9-]{36}/g, '/{id}').replace(/\/[^/]+$/g, '/{id}')
    const normalizedMatch = permissions.some(
      (perm) => {
        const permMethod = perm.method.toUpperCase()
        const reqMethod = method.toUpperCase()
        const permPath = perm.path
        const reqPath = normalizedPath
        
        // Check method match
        if (permMethod !== reqMethod) return false
        
        // Check exact path match
        if (permPath === reqPath) return true
        
        // Check if permission path matches request path (with normalization)
        if (permPath === path) return true
        
        // Check if permission path starts with request path
        if (permPath.startsWith(path) || path.startsWith(permPath)) return true
        
        return false
      }
    )
    
    return normalizedMatch
  }, [permissions, user])

  const hasAnyPermission = useCallback((method: string, paths: string[]): boolean => {
    return paths.some(path => hasPermission(method, path))
  }, [hasPermission])

  const canCreate = useCallback((module: string): boolean => {
    const moduleConfig = Object.values(PERMISSION_MODULES).find(m => m.name === module || m.prefix === module)
    if (!moduleConfig) return false
    return hasPermission("POST", moduleConfig.prefix) || 
           hasAnyPermission("POST", [moduleConfig.prefix, `${moduleConfig.prefix}/`, `${moduleConfig.prefix}/{id}`])
  }, [hasPermission, hasAnyPermission])

  const canRead = useCallback((module: string): boolean => {
    if (!user) {
      console.log(`canRead(${module}): No user, returning false`)
      return false
    }
    if (user.is_admin === true) {
      console.log(`canRead(${module}): User is admin, returning true`)
      return true // Admin has all permissions
    }
    
    // If no permissions loaded yet, wait
    if (permissions.length === 0 && loading) {
      console.log(`canRead(${module}): Permissions loading, returning false`)
      return false
    }
    
    // If no permissions at all (not loading), deny access
    if (permissions.length === 0) {
      console.log(`canRead(${module}): No permissions found for user, denying access`)
      return false
    }
    
    const moduleConfig = Object.values(PERMISSION_MODULES).find(m => m.name === module || m.prefix === module)
    if (!moduleConfig) {
      console.warn(`canRead(${module}): Module not found in PERMISSION_MODULES`)
      return false
    }
    
    // Check for GET permission on the module prefix
    // Try multiple path variations
    const pathsToCheck = [
      moduleConfig.prefix,
      `${moduleConfig.prefix}/`,
      `${moduleConfig.prefix}/{id}`,
      moduleConfig.prefix.replace('/api/', '/api/'),
    ]
    
    const hasAccess = hasPermission("GET", moduleConfig.prefix) || 
                      hasAnyPermission("GET", pathsToCheck)
    
    // Debug logging
    console.log(`canRead(${module}):`, {
      moduleConfig: moduleConfig.prefix,
      pathsToCheck,
      hasAccess,
      permissionCount: permissions.length,
      permissions: permissions.slice(0, 5).map(p => `${p.method} ${p.path}`) // Show first 5
    })
    
    return hasAccess
  }, [hasPermission, hasAnyPermission, permissions, user, loading])

  const canUpdate = useCallback((module: string): boolean => {
    const moduleConfig = Object.values(PERMISSION_MODULES).find(m => m.name === module || m.prefix === module)
    if (!moduleConfig) return false
    return hasPermission("PUT", moduleConfig.prefix) || 
           hasPermission("PATCH", moduleConfig.prefix) ||
           hasAnyPermission("PUT", [moduleConfig.prefix, `${moduleConfig.prefix}/{id}`]) ||
           hasAnyPermission("PATCH", [moduleConfig.prefix, `${moduleConfig.prefix}/{id}`])
  }, [hasPermission, hasAnyPermission])

  const canDelete = useCallback((module: string): boolean => {
    const moduleConfig = Object.values(PERMISSION_MODULES).find(m => m.name === module || m.prefix === module)
    if (!moduleConfig) return false
    return hasPermission("DELETE", moduleConfig.prefix) || 
           hasAnyPermission("DELETE", [moduleConfig.prefix, `${moduleConfig.prefix}/{id}`])
  }, [hasPermission, hasAnyPermission])

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete
  }
}

/**
 * Helper function to extract module from permission path
 */
export function getPermissionModule(path: string): string | null {
  for (const [key, module] of Object.entries(PERMISSION_MODULES)) {
    if (path.startsWith(module.prefix)) {
      return module.name
    }
  }
  return null
}

/**
 * Helper function to group permissions by module
 */
export function groupPermissionsByModule(permissions: Permission[]): Record<string, Permission[]> {
  const grouped: Record<string, Permission[]> = {}
  
  for (const perm of permissions) {
    const module = getPermissionModule(perm.path)
    if (module) {
      if (!grouped[module]) {
        grouped[module] = []
      }
      grouped[module].push(perm)
    } else {
      // Group unmapped permissions under "Other"
      if (!grouped["Other"]) {
        grouped["Other"] = []
      }
      grouped["Other"].push(perm)
    }
  }
  
  return grouped
}

