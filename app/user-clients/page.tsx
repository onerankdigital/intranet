"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader } from "@/components/ui/loader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { userClientApi, clientApi, roleApi, authApi } from "@/lib/api"
import { Eye, Users } from "lucide-react"

// Type definitions
type UserClient = {
  id?: string
  user_id: string
  client_id?: string | null
  role_id?: string
  status?: string
  email?: string
  client_name?: string
  role_name?: string
}

type User = {
  id: string
  email: string
  is_admin?: boolean | string
}

type Client = {
  id?: string
  client_id?: string
  name?: string
}

type Role = {
  id: string
  name?: string
  level?: number
}

type UserGroup = {
  user_id: string
  email: string
  assignments: UserClient[]
}

export default function UserClientsPage() {
  const [userClients, setUserClients] = useState<UserClient[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  // Step 1: Select user
  const [selectedUserId, setSelectedUserId] = useState("")
  // Step 2: Select clients with checkboxes
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set())
  const [clientSearchQuery, setClientSearchQuery] = useState("")
  
  // Current user-client assignments to check which are already assigned
  const [currentAssignments, setCurrentAssignments] = useState<Map<string, UserClient>>(new Map())
  
  // State for viewing user's clients dialog
  const [selectedUserForView, setSelectedUserForView] = useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  useEffect(() => {
    fetchUserClients()
    fetchClients()
    fetchRoles()
    fetchUsers()
  }, [])

  const fetchUserClients = async () => {
    setLoading(true)
    const response = await userClientApi.list()
    if (response.data) {
      setUserClients(Array.isArray(response.data) ? response.data : [])
    } else {
      setMessage({ type: "error", text: response.error || "Failed to fetch user-client assignments" })
    }
    setLoading(false)
  }

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

  const fetchUsers = async () => {
    const response = await authApi.listUsers()
    if (response.data) {
      setUsers(Array.isArray(response.data) ? response.data : [])
    }
  }

  // When user is selected, load their current assignments
  useEffect(() => {
    if (selectedUserId) {
      const userAssignments = userClients.filter((uc: UserClient) => uc.user_id === selectedUserId)
      const assignmentMap = new Map<string, UserClient>()
      userAssignments.forEach((uc: UserClient) => {
        if (uc.client_id) {
          assignmentMap.set(uc.client_id, uc)
        }
      })
      setCurrentAssignments(assignmentMap)
      // Pre-select already assigned clients
      setSelectedClientIds(new Set(userAssignments.map((uc: UserClient) => uc.client_id).filter((id): id is string => !!id)))
    } else {
      setCurrentAssignments(new Map())
      setSelectedClientIds(new Set())
    }
  }, [selectedUserId, userClients])

  // Filter clients based on search query
  const filteredClients = clients.filter((client: Client) => {
    const searchLower = clientSearchQuery.toLowerCase()
    const name = (client.name || "").toLowerCase()
    const clientId = (client.client_id || client.id || "").toLowerCase()
    return name.includes(searchLower) || clientId.includes(searchLower)
  })

  const handleClientToggle = (clientId: string) => {
    const newSelection = new Set(selectedClientIds)
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId)
    } else {
      newSelection.add(clientId)
    }
    setSelectedClientIds(newSelection)
  }

  const handleSelectAllClients = () => {
    if (selectedClientIds.size === filteredClients.length) {
      setSelectedClientIds(new Set())
    } else {
      setSelectedClientIds(new Set(
        filteredClients
          .map((c: Client) => c.client_id || c.id)
          .filter((id): id is string => !!id)
      ))
    }
  }

  // Group user-clients by user_id
  const groupedByUser = userClients.reduce((acc: Record<string, UserGroup>, uc: UserClient) => {
    const userId = uc.user_id
    if (!acc[userId]) {
      acc[userId] = {
        user_id: userId,
        email: uc.email || uc.user_id,
        assignments: []
      }
    }
    // Only add unique client assignments
    const existingAssignment = acc[userId].assignments.find(
      (a: UserClient) => a.client_id === uc.client_id
    )
    if (!existingAssignment) {
      acc[userId].assignments.push(uc)
    }
    return acc
  }, {} as Record<string, UserGroup>)

  // Get clients for a specific user
  const getUserClients = (userId: string): UserClient[] => {
    return groupedByUser[userId]?.assignments || []
  }

  // Handle view details button click
  const handleViewDetails = (userId: string) => {
    setSelectedUserForView(userId)
    setViewDialogOpen(true)
  }

  const handleBulkAssign = async () => {
    if (!selectedUserId) {
      setMessage({ type: "error", text: "Please select a user first" })
      return
    }

    if (selectedClientIds.size === 0) {
      setMessage({ type: "error", text: "Please select at least one client" })
      return
    }

    // Get default role (first role or ask user to select)
    if (roles.length === 0) {
      setMessage({ type: "error", text: "No roles available. Please create a role first." })
      return
    }

    const defaultRoleId = roles[0].id
    setLoading(true)
    setMessage(null)

    try {
      // Assign each selected client to the user
      const assignments = Array.from(selectedClientIds)
      let successCount = 0
      let errorCount = 0

      for (const clientId of assignments) {
        // Check if already assigned (skip to prevent duplicates)
        if (currentAssignments.has(clientId)) {
          continue // Skip already assigned clients
        }

        const data: any = {
          user_id: selectedUserId,
          client_id: clientId,
          role_id: defaultRoleId,
          status: "active",
        }

        try {
          const response = await userClientApi.create(data)
          
          if (response.error) {
            // Check if error is due to duplicate assignment
            if (response.error.includes("already assigned") || response.error.includes("already exists")) {
              // Skip duplicate - don't count as error
              continue
            }
            errorCount++
            console.error(`Failed to assign client ${clientId}:`, response.error)
          } else {
            successCount++
          }
        } catch (error: any) {
          // Handle duplicate assignment errors gracefully
          if (error?.error?.includes("already assigned") || error?.error?.includes("already exists") || 
              error?.message?.includes("already assigned") || error?.message?.includes("already exists")) {
            // Skip duplicate - don't count as error
            continue
          }
          errorCount++
          console.error(`Failed to assign client ${clientId}:`, error)
        }
      }

      if (errorCount === 0) {
        setMessage({ 
          type: "success", 
          text: `Successfully assigned ${successCount} client(s) to user!` 
        })
        // Reset form
        setSelectedUserId("")
        setSelectedClientIds(new Set())
        setClientSearchQuery("")
        setShowCreate(false)
        fetchUserClients()
      } else {
        setMessage({ 
          type: "error", 
          text: `Assigned ${successCount} client(s), but ${errorCount} failed. Check console for details.` 
        })
        fetchUserClients()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to assign clients" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User-Client Assignments</h1>
          <p className="text-muted-foreground">
            Assign users to clients with specific roles
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "Assign User to Client"}
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

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Assign User to Clients</CardTitle>
            <CardDescription>Select a user and then choose multiple clients to assign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Step 1: Select User */}
              <div className="space-y-2">
                <Label htmlFor="user_id">Step 1: Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="user_id">
                    <SelectValue placeholder="-- Select a user --" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: User) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email} {user.is_admin ? "(Admin)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Create users first in the Auth page if needed.
                </p>
              </div>

              {/* Step 2: Select Clients (only shown if user is selected) */}
              {selectedUserId && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Step 2: Select Clients (Select multiple)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllClients}
                    >
                      {selectedClientIds.size === filteredClients.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>

                  {/* Search input */}
                  <div className="space-y-2">
                    <Input
                      placeholder="Search clients by name or ID..."
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Client checkboxes */}
                  <div className="border rounded-md p-4 max-h-96 overflow-y-auto space-y-2">
                    {filteredClients.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No clients found</p>
                    ) : (
                      filteredClients.map((client: Client) => {
                        const clientId = (client.client_id || client.id || "") as string
                        const isAlreadyAssigned = currentAssignments.has(clientId)
                        const isSelected = selectedClientIds.has(clientId)
                        
                        return (
                          <div
                            key={clientId}
                            className={`flex items-center space-x-2 p-2 rounded ${
                              isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                            } ${isAlreadyAssigned ? "opacity-60" : ""}`}
                          >
                            <input
                              type="checkbox"
                              id={`client-${clientId}`}
                              checked={isSelected}
                              onChange={() => handleClientToggle(clientId)}
                              className="h-4 w-4 rounded border-gray-300"
                              disabled={isAlreadyAssigned}
                            />
                            <label
                              htmlFor={`client-${clientId}`}
                              className="flex-1 text-sm cursor-pointer"
                            >
                              {client.name} ({clientId})
                              {isAlreadyAssigned && (
                                <span className="text-xs text-muted-foreground ml-2">(Already assigned)</span>
                              )}
                            </label>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {selectedClientIds.size > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedClientIds.size} client(s) selected
                    </p>
                  )}

                  {/* Save button */}
                  <Button
                    onClick={handleBulkAssign}
                    disabled={loading || selectedClientIds.size === 0}
                    className="w-full"
                  >
                    {loading ? "Assigning..." : `Save Assignment (${selectedClientIds.size} client${selectedClientIds.size !== 1 ? 's' : ''})`}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All User-Client Assignments</CardTitle>
          <CardDescription>List of all user-client relationships</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && userClients.length === 0 ? (
            <Loader text="Loading user-client assignments..." />
          ) : userClients.length === 0 ? (
            <p className="text-muted-foreground">No assignments found. Create one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Email</TableHead>
                  <TableHead>Clients</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Object.values(groupedByUser) as UserGroup[]).map((userGroup) => {
                  const hasMultipleClients = userGroup.assignments.length > 1
                  const firstAssignment = userGroup.assignments[0]
                  
                  return (
                    <TableRow key={userGroup.user_id}>
                      <TableCell className="font-medium">{userGroup.email}</TableCell>
                      <TableCell>
                        {hasMultipleClients ? (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {userGroup.assignments.length} client(s)
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(userGroup.user_id)}
                              className="gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View Details
                            </Button>
                          </div>
                        ) : (
                          <span>{firstAssignment?.client_name || firstAssignment?.client_id || 'N/A'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasMultipleClients ? (
                          <span className="text-muted-foreground text-sm">Multiple roles</span>
                        ) : (
                          <span>{firstAssignment?.role_name || firstAssignment?.role_id}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasMultipleClients ? (
                          <span className="text-muted-foreground text-sm">
                            {userGroup.assignments.every(a => a.status === 'active') 
                              ? 'All Active' 
                              : 'Mixed'}
                          </span>
                        ) : (
                          <span>{firstAssignment?.status}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasMultipleClients && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(userGroup.user_id)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          
          {/* Dialog to show all clients for a user */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Client Assignments for {selectedUserForView && groupedByUser[selectedUserForView]?.email}
                  </DialogTitle>
                  <DialogDescription>
                    All clients assigned to this user
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  {selectedUserForView && getUserClients(selectedUserForView).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client Name</TableHead>
                          <TableHead>Client ID</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Assignment ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getUserClients(selectedUserForView).map((assignment: UserClient) => (
                          <TableRow key={assignment.id || `${assignment.user_id}-${assignment.client_id}`}>
                            <TableCell className="font-medium">
                              {assignment.client_name || 'N/A'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {assignment.client_id || 'N/A'}
                            </TableCell>
                            <TableCell>{assignment.role_name || assignment.role_id}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${
                                assignment.status === 'active' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                              }`}>
                                {assignment.status}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{assignment.id || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No clients assigned to this user
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          
          <div className="mt-4">
            <Button onClick={fetchUserClients} variant="outline" disabled={loading}>
              Refresh List
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

