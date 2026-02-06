"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { authApi, apiClient, clientApi, roleApi, userClientApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { isAdmin } from "@/lib/utils"

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
    name: "",
    email: "",
    password: "",
    is_admin: false,
    assignClient: false,
    client_id: "",
    role_id: "",
  })
  const [activeTab, setActiveTab] = useState<"create-user" | "profile" | "manage-users">("profile")
  const [allUsers, setAllUsers] = useState<any[]>([])

  // Edit user state
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editUserData, setEditUserData] = useState({
    name: "",
    email: "",
    status: "",
    newPassword: "",
    role_id: "",
    client_id: "",
    assignClient: false,
  })
  const [viewingUser, setViewingUser] = useState<any>(null)
  const [userClientAssignments, setUserClientAssignments] = useState<any[]>([])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  // Fetch all users when manage-users tab is active
  useEffect(() => {
    if (activeTab === "manage-users" && isAdmin(user) && allUsers.length === 0) {
      fetchAllUsers()
    }
  }, [activeTab, user])

  const fetchAllUsers = async () => {
    setLoading(true)
    try {
      const response = await authApi.listUsers()
      if (response.data) {
        setAllUsers(Array.isArray(response.data) ? response.data : [])
      } else {
        setMessage({ type: "error", text: response.error || "Failed to fetch users" })
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to fetch users" })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string, isAdminUser: boolean) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?${isAdminUser ? " This is an admin account." : ""}`)) {
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const response = await authApi.deleteUser(userId)
      if (response.error) {
        setMessage({ type: "error", text: response.error })
      } else {
        setMessage({ type: "success", text: `User ${userEmail} deleted successfully!` })
        // Refresh users list
        fetchAllUsers()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to delete user" })
    } finally {
      setLoading(false)
    }
  }

  const handleViewUser = (userObj: any) => {
    setViewingUser(userObj)
  }

  const handleEditUser = async (userObj: any) => {
    setEditingUser(userObj)
    setEditUserData({
      name: userObj.name || "",
      email: userObj.email || "",
      status: userObj.status || "active",
      newPassword: "",
      role_id: "",
      client_id: "",
      assignClient: false,
    })
    
    // Fetch user's current client/role assignments
    try {
      const assignmentsResponse = await userClientApi.list({ user_id: userObj.id })
      if (assignmentsResponse.data && Array.isArray(assignmentsResponse.data) && assignmentsResponse.data.length > 0) {
        const assignments = assignmentsResponse.data
        setUserClientAssignments(assignments)
        // Pre-fill with first assignment (or role-only assignment if exists)
        const roleOnlyAssignment = assignments.find((a: any) => a.client_id === null && a.role_id)
        const firstAssignment = roleOnlyAssignment || assignments[0]
        if (firstAssignment) {
          setEditUserData(prev => ({
            ...prev,
            role_id: firstAssignment.role_id || "",
            client_id: firstAssignment.client_id || "",
            assignClient: !!firstAssignment.client_id,
          }))
        }
      } else {
        setUserClientAssignments([])
      }
    } catch (error) {
      setUserClientAssignments([])
    }
    
    // Ensure roles and clients are loaded
    if (roles.length === 0) fetchRoles()
    if (clients.length === 0) fetchClients()
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setLoading(true)
    setMessage(null)

    try {
      // Update user details
      const updateResponse = await authApi.updateUser(editingUser.id, {
        name: editUserData.name,
        email: editUserData.email,
        status: editUserData.status,
      })

      if (updateResponse.error) {
        setMessage({ type: "error", text: updateResponse.error })
        setLoading(false)
        return
      }

      // Update password if provided
      if (editUserData.newPassword) {
        const passwordResponse = await authApi.changeUserPassword(editingUser.id, {
          new_password: editUserData.newPassword,
        })

        if (passwordResponse.error) {
          setMessage({ type: "error", text: `User updated but password change failed: ${passwordResponse.error}` })
          setLoading(false)
          return
        }
      }

      // Update role/client assignment if changed
      if (editUserData.role_id || editUserData.assignClient) {
        // Check if there's an existing assignment to update
        const existingAssignment = userClientAssignments.find(
          (a: any) => 
            (editUserData.client_id && a.client_id === editUserData.client_id) ||
            (!editUserData.client_id && !a.client_id && editUserData.role_id && a.role_id === editUserData.role_id)
        )

        if (existingAssignment) {
          // Update existing assignment
          const updateData: any = {}
          if (editUserData.role_id) updateData.role_id = editUserData.role_id
          
          const updateResponse = await userClientApi.update(existingAssignment.id, updateData)
          if (updateResponse.error) {
            setMessage({ type: "error", text: `User updated but role assignment update failed: ${updateResponse.error}` })
            setLoading(false)
            return
          }
        } else if (editUserData.role_id || (editUserData.assignClient && editUserData.client_id)) {
          // Create new assignment
          const createResponse = await userClientApi.create({
            user_id: editingUser.id,
            client_id: editUserData.client_id || undefined,
            role_id: editUserData.role_id || undefined,
            status: "active",
          })
          if (createResponse.error) {
            setMessage({ type: "error", text: `User updated but role/client assignment failed: ${createResponse.error}` })
            setLoading(false)
            return
          }
        }
      }

      setMessage({ type: "success", text: "User updated successfully!" })
      setEditingUser(null)
      setEditUserData({ name: "", email: "", status: "", newPassword: "", role_id: "", client_id: "", assignClient: false })
      setUserClientAssignments([])
      fetchAllUsers()
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to update user" })
    } finally {
      setLoading(false)
    }
  }

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
      name: createUserData.name,
      email: createUserData.email,
      password: createUserData.password,
      is_admin: createUserData.is_admin,
    })
    
    if (userResponse.error) {
      setMessage({ type: "error", text: userResponse.error })
      setLoading(false)
      return
    }

    interface UserCreateResponse {
      id: string
      email: string
      is_admin: boolean
      status: string
    }
    const data = userResponse.data as UserCreateResponse | undefined
    const userId = data?.id

    if (!userId) {
      setMessage({ type: "error", text: "User created but user ID not returned" })
      setLoading(false)
      return
    }

    // Assign role and/or client if provided
    if (createUserData.role_id || (createUserData.assignClient && createUserData.client_id)) {
      const assignResponse = await userClientApi.create({
        user_id: userId,
        client_id: createUserData.client_id || undefined,
        role_id: createUserData.role_id || undefined,
        status: "active",
      })

      if (assignResponse.error) {
        setMessage({ 
          type: "error", 
          text: `User created but failed to assign role/client: ${assignResponse.error}` 
        })
      } else {
        if (createUserData.role_id && createUserData.client_id) {
          setMessage({ type: "success", text: "User created and assigned to client with role successfully!" })
        } else if (createUserData.role_id) {
          setMessage({ type: "success", text: "User created with role assigned successfully!" })
        } else {
          setMessage({ type: "success", text: "User created and assigned to client successfully!" })
        }
      }
    } else {
      setMessage({ type: "success", text: "User created successfully!" })
    }

    setCreateUserData({ 
      name: "",
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

    interface TokenResponse {
      access_token: string
      refresh_token: string
      token_type?: string
    }

    const response = await authApi.refresh({ refresh_token: refreshToken })
    if (response.error) {
      setMessage({ type: "error", text: response.error })
    } else {
      const data = response.data as TokenResponse | undefined
      if (data?.access_token) {
        apiClient.setToken(data.access_token)
        if (data.refresh_token && typeof window !== "undefined") {
          localStorage.setItem("refresh_token", data.refresh_token)
        }
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
        {isAdmin(user) && (
          <>
            <Button
              variant={activeTab === "create-user" ? "default" : "ghost"}
              onClick={() => setActiveTab("create-user")}
            >
              Create User (Admin)
            </Button>
            <Button
              variant={activeTab === "manage-users" ? "default" : "ghost"}
              onClick={() => {
                setActiveTab("manage-users")
                fetchAllUsers()
              }}
            >
              Manage Users
            </Button>
          </>
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
                <Label htmlFor="create-name">Name</Label>
                <Input
                  id="create-name"
                  type="text"
                  placeholder="John Doe"
                  value={createUserData.name}
                  onChange={(e) => setCreateUserData({ ...createUserData, name: e.target.value })}
                  required
                />
              </div>
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
              
              <div className="pt-2 border-t space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role-select">Role (Optional)</Label>
                  <select
                    id="role-select"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={createUserData.role_id}
                    onChange={(e) => {
                      setCreateUserData({ 
                        ...createUserData, 
                        role_id: e.target.value
                      })
                    }}
                  >
                    <option value="">-- Select a role (optional) --</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} (Level {role.level})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Select a role to assign permissions. Role can be assigned independently or with a client.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="assign-client"
                    checked={createUserData.assignClient}
                    onChange={(e) => {
                      setCreateUserData({ 
                        ...createUserData, 
                        assignClient: e.target.checked,
                        // Clear client_id when unchecking
                        client_id: e.target.checked ? createUserData.client_id : ""
                      })
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="assign-client" className="cursor-pointer">
                    Assign to Client (Optional)
                  </Label>
                </div>

                {createUserData.assignClient && (
                  <div className="space-y-2">
                    <Label htmlFor="client-select">Client (Optional)</Label>
                    <select
                      id="client-select"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={createUserData.client_id}
                      onChange={(e) => setCreateUserData({ ...createUserData, client_id: e.target.value })}
                    >
                      <option value="">-- Select a client (optional) --</option>
                      {clients.map((client) => (
                        <option key={client.client_id || client.id} value={client.client_id || client.id}>
                          {client.name} ({client.client_id || client.id})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      {createUserData.role_id 
                        ? "Client and role will be assigned together when creating the user."
                        : "Select a client to assign the user. You can also assign a role above."}
                    </p>
                  </div>
                )}
              </div>

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
                        {['id', 'name', 'email', 'status'].map((key) => {
                          if (!(key in userData)) return null;
                          const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

                          return (
                            <TableRow key={key} className="table-row-3d">
                              <TableCell className="font-medium w-1/3">
                                <span className="text-sm">{displayKey}</span>
                              </TableCell>
                              <TableCell className="w-2/3">
                                {renderValue(userData[key])}
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

      {activeTab === "manage-users" && isAdmin(user) && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Users</CardTitle>
            <CardDescription>View and manage all users (Admin only) - Admins can delete other admin accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Button onClick={fetchAllUsers} variant="outline" disabled={loading}>
                Refresh List
              </Button>
            </div>
            {loading && allUsers.length === 0 ? (
              <p>Loading users...</p>
            ) : allUsers.length === 0 ? (
              <p className="text-muted-foreground">No users found.</p>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((u) => {
                      const isAdminUser = u.is_admin === true || u.is_admin === "true" || u.is_admin === "True"
                      const isCurrentUser = u.id === user?.id
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">
                            {u.email}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isAdminUser ? (
                              <Badge variant="default">Admin</Badge>
                            ) : (
                              <Badge variant="secondary">User</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.status === "active" ? "default" : "secondary"}>
                              {u.status || "active"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs text-muted-foreground font-mono">
                              {u.id.substring(0, 8)}...
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewUser(u)}
                                disabled={loading}
                              >
                                View
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleEditUser(u)}
                                disabled={loading}
                              >
                                Edit
                              </Button>
                              {!isCurrentUser && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteUser(u.id, u.email, isAdminUser)}
                                  disabled={loading}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View User Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>View User Details</DialogTitle>
            <DialogDescription>User information (read-only)</DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ID</Label>
                <div className="p-2 bg-muted rounded-md">
                  <code className="text-xs font-mono">{viewingUser.id}</code>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <div className="p-2 bg-muted rounded-md">
                  <span className="text-sm">{viewingUser.name || "N/A"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="p-2 bg-muted rounded-md">
                  <span className="text-sm">{viewingUser.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="p-2 bg-muted rounded-md">
                  <Badge variant={viewingUser.status === "active" ? "default" : "secondary"}>
                    {viewingUser.status || "active"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Admin</Label>
                <div className="p-2 bg-muted rounded-md">
                  <Badge variant={(viewingUser.is_admin === true || viewingUser.is_admin === "true" || viewingUser.is_admin === "True") ? "default" : "secondary"}>
                    {(viewingUser.is_admin === true || viewingUser.is_admin === "true" || viewingUser.is_admin === "True") ? "Admin" : "User"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingUser(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details and optionally change password</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    type="text"
                    placeholder="John Doe"
                    value={editUserData.name}
                    onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="user@example.com"
                    value={editUserData.email}
                    onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editUserData.status}
                    onValueChange={(value) => setEditUserData({ ...editUserData, status: value })}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">New Password (Optional)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={editUserData.newPassword}
                    onChange={(e) => setEditUserData({ ...editUserData, newPassword: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only fill this field if you want to change the user's password
                  </p>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Role (Optional)</Label>
                    <select
                      id="edit-role"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editUserData.role_id}
                      onChange={(e) => {
                        setEditUserData({ 
                          ...editUserData, 
                          role_id: e.target.value
                        })
                      }}
                    >
                      <option value="">-- Select a role (optional) --</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} (Level {role.level})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Assign or change the user's role. Role can be assigned independently or with a client.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-assign-client"
                      checked={editUserData.assignClient}
                      onChange={(e) => {
                        setEditUserData({ 
                          ...editUserData, 
                          assignClient: e.target.checked,
                          client_id: e.target.checked ? editUserData.client_id : ""
                        })
                      }}
                      className="rounded"
                    />
                    <Label htmlFor="edit-assign-client" className="cursor-pointer">
                      Assign to Client (Optional)
                    </Label>
                  </div>

                  {editUserData.assignClient && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-client">Client (Optional)</Label>
                      <select
                        id="edit-client"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={editUserData.client_id}
                        onChange={(e) => setEditUserData({ ...editUserData, client_id: e.target.value })}
                      >
                        <option value="">-- Select a client (optional) --</option>
                        {clients.map((client) => (
                          <option key={client.client_id || client.id} value={client.client_id || client.id}>
                            {client.name} ({client.client_id || client.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

