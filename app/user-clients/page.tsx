"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader } from "@/components/ui/loader"
import { userClientApi, clientApi, roleApi, authApi } from "@/lib/api"

export default function UserClientsPage() {
  const [userClients, setUserClients] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const [createData, setCreateData] = useState({
    user_id: "",
    client_id: "",
    role_id: "",
    reports_to_user_client_id: "",
    status: "active",
  })

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const data: any = {
      user_id: createData.user_id,
      client_id: createData.client_id,
      role_id: createData.role_id,
      status: createData.status,
    }

    if (createData.reports_to_user_client_id) {
      data.reports_to_user_client_id = createData.reports_to_user_client_id
    }

    const response = await userClientApi.create(data)
    
    if (response.error) {
      setMessage({ type: "error", text: response.error })
    } else {
      setMessage({ type: "success", text: "User assigned to client successfully!" })
      setCreateData({
        user_id: "",
        client_id: "",
        role_id: "",
        reports_to_user_client_id: "",
        status: "active",
      })
      setShowCreate(false)
      fetchUserClients()
    }
    setLoading(false)
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
            <CardTitle>Assign User to Client</CardTitle>
            <CardDescription>Create a new user-client relationship with a role</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">User</Label>
                <select
                  id="user_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={createData.user_id}
                  onChange={(e) => setCreateData({ ...createData, user_id: e.target.value })}
                  required
                >
                  <option value="">-- Select a user --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email} {user.is_admin ? "(Admin)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Create users first in the Auth page if needed.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <select
                  id="client_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={createData.client_id}
                  onChange={(e) => setCreateData({ ...createData, client_id: e.target.value })}
                  required
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
                <Label htmlFor="role_id">Role</Label>
                <select
                  id="role_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={createData.role_id}
                  onChange={(e) => setCreateData({ ...createData, role_id: e.target.value })}
                  required
                >
                  <option value="">-- Select a role --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} (Level {role.level})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reports_to">Reports To (User-Client ID, optional)</Label>
                <Input
                  id="reports_to"
                  placeholder="Enter user-client ID for hierarchy"
                  value={createData.reports_to_user_client_id}
                  onChange={(e) => setCreateData({ ...createData, reports_to_user_client_id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  placeholder="active"
                  value={createData.status}
                  onChange={(e) => setCreateData({ ...createData, status: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Assigning..." : "Assign User to Client"}
              </Button>
            </form>
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
                  <TableHead>Client</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userClients.map((uc) => (
                  <TableRow key={uc.id || `${uc.user_id}-${uc.client_id}`}>
                    <TableCell>{uc.email || uc.user_id}</TableCell>
                    <TableCell>{uc.client_name || uc.client_id}</TableCell>
                    <TableCell>{uc.role_name || uc.role_id}</TableCell>
                    <TableCell>{uc.status}</TableCell>
                    <TableCell className="font-mono text-xs">{uc.id || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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

