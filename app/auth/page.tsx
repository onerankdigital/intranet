"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { authApi, apiClient, clientApi, roleApi, userClientApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

// Helper function to render nested values as tables
const renderValue = (value: any, depth: number = 0): React.ReactNode => {
  if (depth > 3) {
    return <span className="text-xs text-muted-foreground italic">Complex nested structure</span>
  }
  
  if (value === null || value === undefined) {
    return <span className="text-sm text-muted-foreground italic">N/A</span>
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-sm text-muted-foreground italic">Empty array</span>
    }
    return (
      <div className="text-sm space-y-1">
        {value.map((item, idx) => (
          <div key={idx} className="p-1 bg-muted/50 rounded text-xs">
            {typeof item === 'object' && item !== null 
              ? renderValue(item, depth + 1)
              : String(item)}
          </div>
        ))}
      </div>
    )
  }
  
  if (typeof value === 'object') {
    return (
      <div className="text-xs">
        <div className="rounded border overflow-hidden max-w-md">
          <Table>
            <TableBody>
              {Object.entries(value).map(([nestedKey, nestedValue]) => {
                const nestedDisplayKey = nestedKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                return (
                  <TableRow key={nestedKey} className="border-b last:border-0">
                    <TableCell className="font-medium py-1 px-2 w-1/3">
                      {nestedDisplayKey}
                    </TableCell>
                    <TableCell className="py-1 px-2 w-2/3">
                      {renderValue(nestedValue, depth + 1)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }
  
  return <span className="text-sm">{String(value)}</span>
}

export default function AuthPage() {
  const router = useRouter()
  const { isAuthenticated, user, loading: authLoading, checkAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])

  const [createUserData, setCreateUserData] = useState({ 
    email: "", 
    password: "", 
    is_admin: false,
    assignClient: false,
    client_id: "",
    role_id: "",
  })
  const [activeTab, setActiveTab] = useState<"create-user" | "profile">("profile")

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  // This page is for admin user management, not login
  // Login is handled on /login page
  if (authLoading) {
    return <div className="p-6">Loading...</div>
  }

  if (!isAuthenticated) {
    return null // Will redirect via useEffect
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Create user first
    const userResponse = await authApi.createUser({
      email: createUserData.email,
      password: createUserData.password,
      is_admin: createUserData.is_admin,
    })
    
    if (userResponse.error) {
      setMessage({ type: "error", text: userResponse.error })
      setLoading(false)
      return
    }

    const userId = userResponse.data?.id

    // If client and role are selected, assign user to client
    if (createUserData.assignClient && createUserData.client_id && createUserData.role_id && userId) {
      const assignResponse = await userClientApi.create({
        user_id: userId,
        client_id: createUserData.client_id,
        role_id: createUserData.role_id,
        status: "active",
      })

      if (assignResponse.error) {
        setMessage({ 
          type: "error", 
          text: `User created but failed to assign to client: ${assignResponse.error}` 
        })
      } else {
        setMessage({ type: "success", text: "User created and assigned to client successfully!" })
      }
    } else {
      setMessage({ type: "success", text: "User created successfully!" })
    }

    setCreateUserData({ 
      email: "", 
      password: "", 
      is_admin: false,
      assignClient: false,
      client_id: "",
      role_id: "",
    })
    setLoading(false)
  }

  const fetchUserProfile = async () => {
    setLoading(true)
    await checkAuth()
    if (user) {
      setUserData(user)
    }
    setLoading(false)
  }

  // Load user data on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      setUserData(user)
    }
  }, [isAuthenticated, user])

  // Load clients and roles when creating user
  useEffect(() => {
    if (activeTab === "create-user") {
      fetchClients()
      fetchRoles()
    }
  }, [activeTab])

  const fetchClients = async () => {
    const response = await clientApi.list()
    if (response.data) {
      setClients(Array.isArray(response.data) ? response.data : [])
    }
  }

  const fetchRoles = async () => {
    const response = await roleApi.list()
    if (response.data) {
      setRoles(Array.isArray(response.data) ? response.data : [])
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null
    if (!refreshToken) {
      setMessage({ type: "error", text: "No refresh token found" })
      setLoading(false)
      return
    }

    const response = await authApi.refresh({ refresh_token: refreshToken })
    if (response.error) {
      setMessage({ type: "error", text: response.error })
    } else {
      const { access_token } = response.data || {}
      if (access_token) {
        apiClient.setToken(access_token)
        setMessage({ type: "success", text: "Token refreshed!" })
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Authentication</h1>
        <p className="text-muted-foreground">
          Manage user authentication, registration, and tokens
        </p>
      </div>

      <div className="flex gap-2 border-b">
        {(user?.is_admin === true || user?.is_admin === "true" || user?.is_admin === "True") && (
          <Button
            variant={activeTab === "create-user" ? "default" : "ghost"}
            onClick={() => setActiveTab("create-user")}
          >
            Create User (Admin)
          </Button>
        )}
        <Button
          variant={activeTab === "profile" ? "default" : "ghost"}
          onClick={() => {
            setActiveTab("profile")
            fetchUserProfile()
          }}
        >
          Profile
        </Button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {activeTab === "create-user" && user?.is_admin && (
        <Card>
          <CardHeader>
            <CardTitle>Create User</CardTitle>
            <CardDescription>Create a new user account (Admin only)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="user@example.com"
                  value={createUserData.email}
                  onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createUserData.password}
                  onChange={(e) => setCreateUserData({ ...createUserData, password: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-admin"
                  checked={createUserData.is_admin}
                  onChange={(e) => setCreateUserData({ ...createUserData, is_admin: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is-admin" className="cursor-pointer">
                  Admin User
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 pt-2 border-t">
                <input
                  type="checkbox"
                  id="assign-client"
                  checked={createUserData.assignClient}
                  onChange={(e) => setCreateUserData({ ...createUserData, assignClient: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="assign-client" className="cursor-pointer">
                  Assign to Client (Optional)
                </Label>
              </div>

              {createUserData.assignClient && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="client-select">Client</Label>
                    <select
                      id="client-select"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={createUserData.client_id}
                      onChange={(e) => setCreateUserData({ ...createUserData, client_id: e.target.value })}
                      required={createUserData.assignClient}
                    >
                      <option value="">-- Select a client --</option>
                      {clients.map((client) => (
                        <option key={client.client_id || client.id} value={client.client_id || client.id}>
                          {client.name} ({client.client_id || client.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-select">Role</Label>
                    <select
                      id="role-select"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={createUserData.role_id}
                      onChange={(e) => setCreateUserData({ ...createUserData, role_id: e.target.value })}
                      required={createUserData.assignClient}
                    >
                      <option value="">-- Select a role --</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} (Level {role.level})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create User"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "profile" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && !userData ? (
                <p>Loading...</p>
              ) : userData ? (
                <div className="space-y-2">
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Field</TableHead>
                          <TableHead className="font-semibold">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(userData).map(([key, value]) => {
                          const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                          
                          return (
                            <TableRow key={key} className="table-row-3d">
                              <TableCell className="font-medium w-1/3">
                                <span className="text-sm">{displayKey}</span>
                              </TableCell>
                              <TableCell className="w-2/3">
                                {renderValue(value)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No profile data. Please login first.</p>
              )}
              <div className="flex gap-2">
                <Button onClick={fetchUserProfile} disabled={loading}>
                  Refresh Profile
                </Button>
                <Button onClick={handleRefresh} variant="outline" disabled={loading}>
                  Refresh Token
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

