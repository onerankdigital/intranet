"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader } from "@/components/ui/loader"
import { permissionApi } from "@/lib/api"
import { Key, Plus, RefreshCw, CheckCircle2, XCircle, Search } from "lucide-react"

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<any[]>([])
  const [availableEndpoints, setAvailableEndpoints] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [createData, setCreateData] = useState({
    method: "GET",
    path: "",
    description: "",
  })

  useEffect(() => {
    fetchPermissions()
    fetchAvailableEndpoints()
  }, [])

  // Refresh endpoints when showing create form
  useEffect(() => {
    if (showCreate) {
      fetchAvailableEndpoints()
    }
  }, [showCreate])

  const fetchPermissions = async () => {
    setLoading(true)
    const response = await permissionApi.list()
    if (response.data) {
      setPermissions(Array.isArray(response.data) ? response.data : [])
    } else {
      setMessage({ type: "error", text: response.error || "Failed to fetch permissions" })
    }
    setLoading(false)
  }

  const fetchAvailableEndpoints = async () => {
    try {
      const response = await permissionApi.getAvailableEndpoints()
      if (response.data) {
        setAvailableEndpoints(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      console.error("Failed to fetch available endpoints:", error)
    }
  }

  const handleEndpointSelect = (endpointValue: string) => {
    const endpoint = availableEndpoints.find(
      (ep) => `${ep.method}:${ep.path}` === endpointValue
    )
    if (endpoint) {
      setCreateData({
        method: endpoint.method,
        path: endpoint.path,
        description: endpoint.description || "",
      })
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const response = await permissionApi.create(createData)
    
    if (response.error) {
      setMessage({ type: "error", text: response.error })
    } else {
      setMessage({ type: "success", text: "Permission created successfully!" })
      setCreateData({ method: "GET", path: "", description: "" })
      setShowCreate(false)
      fetchPermissions()
    }
    setLoading(false)
  }

  const filteredPermissions = permissions.filter((perm) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      perm.method?.toLowerCase().includes(query) ||
      perm.path?.toLowerCase().includes(query) ||
      perm.description?.toLowerCase().includes(query)
    )
  })

  const getMethodBadgeVariant = (method: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (method) {
      case "GET":
        return "secondary"
      case "POST":
        return "default"
      case "PUT":
        return "default"
      case "DELETE":
        return "destructive"
      case "PATCH":
        return "secondary"
      default:
        return "default"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
              <p className="text-muted-foreground">
                Manage API endpoint permissions and access control
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchPermissions}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
            <Plus className="h-4 w-4" />
            {showCreate ? "Cancel" : "Create Permission"}
          </Button>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Create Form */}
      {showCreate && (
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create Permission
            </CardTitle>
            <CardDescription>Add a new API endpoint permission to the system</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="endpoint-select" className="text-sm font-semibold">
                  Select API Endpoint
                </Label>
                <Select onValueChange={handleEndpointSelect}>
                  <SelectTrigger id="endpoint-select" className="h-11">
                    <SelectValue placeholder="Search and select an API endpoint..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {availableEndpoints.map((endpoint, index) => (
                      <SelectItem
                        key={`${endpoint.method}:${endpoint.path}:${index}`}
                        value={`${endpoint.method}:${endpoint.path}`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={getMethodBadgeVariant(endpoint.method)} className="text-xs">
                            {endpoint.method}
                          </Badge>
                          <span className="font-mono text-xs">{endpoint.path}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  Select an endpoint to auto-fill method, path, and description
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="method" className="text-sm font-semibold">
                    HTTP Method
                  </Label>
                  <Select
                    value={createData.method}
                    onValueChange={(value) => setCreateData({ ...createData, method: value })}
                  >
                    <SelectTrigger id="method" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="path" className="text-sm font-semibold">
                    API Path
                  </Label>
                  <Input
                    id="path"
                    placeholder="/api/clients"
                    value={createData.path}
                    onChange={(e) => setCreateData({ ...createData, path: e.target.value })}
                    className="h-11 font-mono"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Description
                </Label>
                <Input
                  id="description"
                  placeholder="Permission description (optional)"
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  className="h-11"
                />
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Create Permission
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreate(false)
                    setCreateData({ method: "GET", path: "", description: "" })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Permissions List */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                All Permissions
              </CardTitle>
              <CardDescription className="mt-1">
                {permissions.length} permission{permissions.length !== 1 ? "s" : ""} registered in the system
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredPermissions.length} shown
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by method, path, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 input-3d"
                  />
            </div>
          </div>

          {/* Loading State */}
          {loading && permissions.length === 0 ? (
            <Loader text="Loading permissions..." />
          ) : filteredPermissions.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">
                {searchQuery ? "No permissions match your search" : "No permissions found"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? "Try a different search term" : "Create one to get started"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border ">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Method</TableHead>
                    <TableHead className="font-semibold">Path</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.map((permission) => (
                    <TableRow key={permission.id} className="table-row-3d">
                      <TableCell>
                        <Badge variant={getMethodBadgeVariant(permission.method)} >
                          {permission.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                          {permission.path}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <span className="text-sm">
                          {permission.description || (
                            <span className="text-muted-foreground italic">No description</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground font-mono">
                          {permission.id.substring(0, 8)}...
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

