"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { roleApi, permissionApi, rolePermissionApi } from "@/lib/api"

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [rolePermissions, setRolePermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions()
    }
  }, [selectedRole])

  const fetchRoles = async () => {
    setLoading(true)
    const response = await roleApi.list()
    if (response.data) {
      setRoles(Array.isArray(response.data) ? response.data : [])
    }
    setLoading(false)
  }

  const fetchPermissions = async () => {
    const response = await permissionApi.list()
    if (response.data) {
      setPermissions(Array.isArray(response.data) ? response.data : [])
    }
  }

  const fetchRolePermissions = async () => {
    if (!selectedRole) return
    setLoading(true)
    const response = await roleApi.getPermissions(selectedRole)
    if (response.data) {
      setRolePermissions(Array.isArray(response.data) ? response.data : [])
    } else {
      setRolePermissions([])
    }
    setLoading(false)
  }

  const handleAssign = async (permissionId: string) => {
    if (!selectedRole) {
      setMessage({ type: "error", text: "Please select a role first" })
      return
    }

    setLoading(true)
    setMessage(null)

    const response = await rolePermissionApi.assign({
      role_id: selectedRole,
      permission_id: permissionId,
    })
    
    if (response.error) {
      setMessage({ type: "error", text: response.error })
    } else {
      setMessage({ type: "success", text: "Permission assigned successfully!" })
      fetchRolePermissions()
    }
    setLoading(false)
  }

  const handleRemove = async (permissionId: string) => {
    if (!selectedRole) return

    setLoading(true)
    setMessage(null)

    const response = await rolePermissionApi.remove({
      role_id: selectedRole,
      permission_id: permissionId,
    })
    
    if (response.error) {
      setMessage({ type: "error", text: response.error })
    } else {
      setMessage({ type: "success", text: "Permission removed successfully!" })
      fetchRolePermissions()
    }
    setLoading(false)
  }

  const assignedPermissionIds = new Set(rolePermissions.map((rp) => rp.id || rp.permission_id))
  const availablePermissions = permissions.filter((p) => !assignedPermissionIds.has(p.id))

  // Helper function to check if a permission is cross-client
  const isCrossClientPermission = (permission: any): boolean => {
    const path = permission.path || ""
    const description = (permission.description || "").toLowerCase()
    
    // Check if path ends with /all
    if (path.endsWith('/all')) {
      return true
    }
    
    // Check if description contains cross-client keywords
    const crossClientKeywords = [
      'cross-client', 'cross client', 'all clients', 'all enquiries', 
      'all transactions', 'all leads', 'global access', 'admin access',
      'view all', 'access all'
    ]
    
    return crossClientKeywords.some(keyword => description.includes(keyword))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Role Permissions</h1>
        <p className="text-muted-foreground">
          Assign permissions to roles
        </p>
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

      <Card>
        <CardHeader>
          <CardTitle>Select Role</CardTitle>
          <CardDescription>Choose a role to manage its permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="role-select">Role</Label>
            <select
              id="role-select"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">-- Select a role --</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} (Level {role.level})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {selectedRole && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Assigned Permissions</CardTitle>
              <CardDescription>Permissions currently assigned to this role</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : rolePermissions.length === 0 ? (
                <p className="text-muted-foreground">No permissions assigned to this role.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rolePermissions.map((rp) => {
                      const perm = rp.permission || rp
                      const isCrossClient = isCrossClientPermission(perm)
                      return (
                        <TableRow key={perm.id || rp.permission_id}>
                          <TableCell className="font-medium">{perm.method}</TableCell>
                          <TableCell className="font-mono text-sm">{perm.path}</TableCell>
                          <TableCell>{perm.description || "N/A"}</TableCell>
                          <TableCell>
                            {isCrossClient ? (
                              <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                                Cross-Client
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Standard</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemove(perm.id || rp.permission_id)}
                              disabled={loading}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Permissions</CardTitle>
              <CardDescription>Permissions that can be assigned to this role</CardDescription>
            </CardHeader>
            <CardContent>
              {availablePermissions.length === 0 ? (
                <p className="text-muted-foreground">All permissions are already assigned to this role.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Access Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availablePermissions.map((permission) => {
                      const isCrossClient = isCrossClientPermission(permission)
                      return (
                        <TableRow key={permission.id}>
                          <TableCell className="font-medium">{permission.method}</TableCell>
                          <TableCell className="font-mono text-sm">{permission.path}</TableCell>
                          <TableCell>{permission.description || "N/A"}</TableCell>
                          <TableCell>
                            {isCrossClient ? (
                              <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                                Cross-Client
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Standard</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssign(permission.id)}
                              disabled={loading}
                            >
                              Assign
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

