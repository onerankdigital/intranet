"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader } from "@/components/ui/loader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { roleApi } from "@/lib/api"
import { Shield, Plus, RefreshCw, CheckCircle2, XCircle, Search, Eye, X } from "lucide-react"

export default function RolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<any | null>(null)

  const [createData, setCreateData] = useState({
    name: "",
    level: "1",
    description: "",
    status: "active",
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    setLoading(true)
    const response = await roleApi.list()
    if (response.data) {
      setRoles(Array.isArray(response.data) ? response.data : [])
    } else {
      setMessage({ type: "error", text: getErrorMessage(response.error) || "Failed to fetch roles" })
    }
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const response = await roleApi.create(createData)
    
    if (response.error) {
      setMessage({ type: "error", text: getErrorMessage(response.error) })
    } else {
      setMessage({ type: "success", text: "Role created successfully!" })
      setCreateData({ name: "", level: "1", description: "", status: "active" })
      setShowCreate(false)
      fetchRoles()
    }
    setLoading(false)
  }

  const handleViewRole = async (roleId: string) => {
    setLoading(true)
    try {
      const response = await roleApi.get(roleId)
      if (response.data) {
        setSelectedRole(response.data)
        // Show role details in message
        const roleDetails = [
          `Role: ${response.data.name}`,
          `Level: ${response.data.level}`,
          `Status: ${response.data.status}`,
          response.data.description ? `Description: ${response.data.description}` : "No description"
        ].join("\n")
        setMessage({ 
          type: "success", 
          text: `Role Details:\n${roleDetails}` 
        })
        // Scroll to top to show the message
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        setMessage({ type: "error", text: getErrorMessage(response.error) || "Failed to fetch role" })
      }
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) || "Failed to fetch role details" })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to safely convert error to string
  const getErrorMessage = (error: any): string => {
    if (!error) return "An error occurred"
    if (typeof error === "string") return error
    if (Array.isArray(error)) {
      return error.map((e) => {
        if (typeof e === "string") return e
        if (e && typeof e === "object") {
          return e.msg || e.message || JSON.stringify(e)
        }
        return String(e)
      }).join(", ")
    }
    if (error && typeof error === "object") {
      return error.msg || error.message || error.detail || JSON.stringify(error)
    }
    return String(error)
  }

  const filteredRoles = roles.filter((role) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      role.name?.toLowerCase().includes(query) ||
      role.description?.toLowerCase().includes(query) ||
      role.level?.toString().includes(query)
    )
  })

  const getLevelColor = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    const levelNum = parseInt(level) || 0
    if (levelNum >= 8) return "destructive"
    if (levelNum >= 5) return "default"
    if (levelNum >= 3) return "secondary"
    return "secondary"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
              <p className="text-muted-foreground">
                Manage roles and their hierarchy levels
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchRoles}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
            <Plus className="h-4 w-4" />
            {showCreate ? "Cancel" : "Create Role"}
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
          <AlertDescription>
            <div className="whitespace-pre-line">
              {typeof message.text === "string" ? message.text : getErrorMessage(message.text)}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Create Form */}
      {showCreate && (
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create Role
            </CardTitle>
            <CardDescription>Add a new role to the system with hierarchy level</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">
                    Role Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Sales Manager"
                    value={createData.name}
                    onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level" className="text-sm font-semibold">
                    Hierarchy Level (1-10) *
                  </Label>
                  <Input
                    id="level"
                    type="number"
                    min="1"
                    max="10"
                    placeholder="1"
                    value={createData.level}
                    onChange={(e) => setCreateData({ ...createData, level: e.target.value })}
                    className="h-11"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher level = more authority in hierarchy
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Description
                </Label>
                <Input
                  id="description"
                  placeholder="Role description and responsibilities"
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-semibold">
                  Status
                </Label>
                <Select
                  value={createData.status}
                  onValueChange={(value) => setCreateData({ ...createData, status: value })}
                >
                  <SelectTrigger id="status" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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
                      Create Role
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreate(false)
                    setCreateData({ name: "", level: "1", description: "", status: "active" })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Roles List */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                All Roles
              </CardTitle>
              <CardDescription className="mt-1">
                {roles.length} role{roles.length !== 1 ? "s" : ""} defined in the system
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredRoles.length} shown
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, level, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 input-3d"
                  />
            </div>
          </div>

          {/* Loading State */}
          {loading && roles.length === 0 ? (
            <Loader text="Loading roles..." />
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">
                {searchQuery ? "No roles match your search" : "No roles found"}
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
                    <TableHead className="font-semibold">Role Name</TableHead>
                    <TableHead className="font-semibold">Level</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id} className="table-row-3d">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{role.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getLevelColor(role.level)} >
                          Level {role.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <span className="text-sm">
                          {role.description || (
                            <span className="text-muted-foreground italic">No description</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.status === "active" ? "default" : "secondary"} >
                          {role.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRole(role.id)}
                          className="gap-2"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
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

