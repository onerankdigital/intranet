"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { roleApi, permissionApi, rolePermissionApi } from "@/lib/api"
import { PERMISSION_MODULES } from "@/lib/use-permissions"
import { Shield, CheckCircle2, XCircle, Save, RefreshCw, FolderOpen } from "lucide-react"

interface ModulePermissions {
  read: boolean
  create: boolean
  update: boolean
  delete: boolean
  crossClient: boolean
}

interface RolePermissionsState {
  [module: string]: ModulePermissions
}

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // State for module-based permissions
  const [modulePermissions, setModulePermissions] = useState<RolePermissionsState>({})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions()
    } else {
      setModulePermissions({})
      setHasChanges(false)
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

  const loadRolePermissions = async () => {
    if (!selectedRole) return
    
    setLoading(true)
    setMessage(null)
    
    try {
      // Get summary for quick overview
      const summaryResponse = await rolePermissionApi.getSummary(selectedRole)
      
      if (summaryResponse.data && summaryResponse.data.modules) {
        const modules: RolePermissionsState = {}
        
        // Initialize all modules
        Object.values(PERMISSION_MODULES).forEach(module => {
          modules[module.name] = {
            read: false,
            create: false,
            update: false,
            delete: false,
            crossClient: false
          }
        })
        
        // Populate from summary
        Object.entries(summaryResponse.data.modules).forEach(([moduleName, moduleData]: [string, any]) => {
          if (modules[moduleName]) {
            modules[moduleName] = {
              read: moduleData.read || false,
              create: moduleData.create || false,
              update: moduleData.update || false,
              delete: moduleData.delete || false,
              crossClient: moduleData.cross_client || false
            }
          }
        })
        
        setModulePermissions(modules)
        setHasChanges(false)
      } else {
        // Fallback: load all permissions and group them
        const response = await roleApi.getPermissions(selectedRole)
        if (response.data) {
          const rolePerms = Array.isArray(response.data) ? response.data : []
          const modules: RolePermissionsState = {}
          
          // Group permissions by module
          rolePerms.forEach((rp: any) => {
            const perm = rp.permission || rp
            const module = perm.module || getModuleFromPath(perm.path)
            
            if (!modules[module]) {
              modules[module] = {
                read: false,
                create: false,
                update: false,
                delete: false,
                crossClient: false
              }
            }
            
            // Update based on action type
            const actionType = perm.action_type || getActionFromMethod(perm.method)
            if (actionType === "read" || perm.method === "GET") {
              modules[module].read = true
            } else if (actionType === "create" || perm.method === "POST") {
              modules[module].create = true
            } else if (actionType === "update" || perm.method === "PUT" || perm.method === "PATCH") {
              modules[module].update = true
            } else if (actionType === "delete" || perm.method === "DELETE") {
              modules[module].delete = true
            }
            
            if (perm.is_cross_client || perm.path?.endsWith('/all')) {
              modules[module].crossClient = true
            }
          })
          
          setModulePermissions(modules)
          setHasChanges(false)
        }
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to load permissions" })
    }
    
    setLoading(false)
  }

  const getModuleFromPath = (path: string): string => {
    for (const module of Object.values(PERMISSION_MODULES)) {
      if (path.startsWith(module.prefix)) {
        return module.name
      }
    }
    return "Other"
  }

  const getActionFromMethod = (method: string): string => {
    const map: { [key: string]: string } = {
      "GET": "read",
      "POST": "create",
      "PUT": "update",
      "PATCH": "update",
      "DELETE": "delete"
    }
    return map[method] || "other"
  }

  const handleModulePermissionChange = (
    module: string,
    field: keyof ModulePermissions,
    value: boolean
  ) => {
    setModulePermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const handleSelectAllModule = (module: string, select: boolean) => {
    setModulePermissions(prev => ({
      ...prev,
      [module]: {
        read: select,
        create: select,
        update: select,
        delete: select,
        crossClient: prev[module]?.crossClient || false
      }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!selectedRole) {
      setMessage({ type: "error", text: "Please select a role first" })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      // Get all permissions for each module
      const permissionIdsToAssign: string[] = []
      const permissionIdsToRemove: string[] = []

      // Get current role permissions
      const currentResponse = await roleApi.getPermissions(selectedRole)
      const currentPermissions = Array.isArray(currentResponse.data) ? currentResponse.data : []
      const currentPermissionIds = new Set(
        currentPermissions.map((rp: any) => (rp.permission || rp).id)
      )

      // Process each module
      for (const [moduleName, modulePerms] of Object.entries(modulePermissions)) {
        const moduleConfig = Object.values(PERMISSION_MODULES).find(m => m.name === moduleName)
        if (!moduleConfig) continue

        // Get all permissions for this module
        const modulePermsList = permissions.filter(p => {
          const permModule = p.module || getModuleFromPath(p.path)
          return permModule === moduleName
        })

        // Determine which permissions should be assigned
        const actions: string[] = []
        if (modulePerms.read) actions.push("read")
        if (modulePerms.create) actions.push("create")
        if (modulePerms.update) actions.push("update")
        if (modulePerms.delete) actions.push("delete")

        // Find matching permissions
        modulePermsList.forEach(perm => {
          const actionType = perm.action_type || getActionFromMethod(perm.method)
          const isCrossClient = perm.is_cross_client || perm.path?.endsWith('/all')
          
          const shouldHave = actions.includes(actionType) && 
                            (isCrossClient === modulePerms.crossClient || !modulePerms.crossClient)
          
          if (shouldHave && !currentPermissionIds.has(perm.id)) {
            permissionIdsToAssign.push(perm.id)
          } else if (!shouldHave && currentPermissionIds.has(perm.id)) {
            permissionIdsToRemove.push(perm.id)
          }
        })
      }

      // Perform bulk operations
      if (permissionIdsToAssign.length > 0) {
        await rolePermissionApi.bulkAssign({
          role_id: selectedRole,
          permission_ids: permissionIdsToAssign,
          action: "assign"
        })
      }

      if (permissionIdsToRemove.length > 0) {
        await rolePermissionApi.bulkAssign({
          role_id: selectedRole,
          permission_ids: permissionIdsToRemove,
          action: "remove"
        })
      }

      setMessage({ 
        type: "success", 
        text: `Successfully updated permissions! Assigned: ${permissionIdsToAssign.length}, Removed: ${permissionIdsToRemove.length}` 
      })
      setHasChanges(false)
      
      // Reload to sync state
      await loadRolePermissions()
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to save permissions" })
    }

    setSaving(false)
  }

  const moduleList = Object.values(PERMISSION_MODULES)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Permissions</h1>
          <p className="text-muted-foreground">
            Manage permissions for roles using a simplified module-based interface
          </p>
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

      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Role</CardTitle>
          <CardDescription>Choose a role to manage its permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="role-select">Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role-select" className="h-11">
                <SelectValue placeholder="-- Select a role --" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name} (Level {role.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Module-Based Permission Grid */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Module Permissions
                </CardTitle>
                <CardDescription>
                  Select permissions by module and action type
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="outline" className="text-orange-600">
                    Unsaved Changes
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadRolePermissions}
                  disabled={loading || saving}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || saving || !hasChanges}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading permissions...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {moduleList.map((moduleConfig) => {
                  const moduleName = moduleConfig.name
                  const modulePerms = modulePermissions[moduleName] || {
                    read: false,
                    create: false,
                    update: false,
                    delete: false,
                    crossClient: false
                  }
                  
                  const allSelected = modulePerms.read && modulePerms.create && 
                                     modulePerms.update && modulePerms.delete
                  const someSelected = modulePerms.read || modulePerms.create || 
                                      modulePerms.update || modulePerms.delete

                  return (
                    <div
                      key={moduleName}
                      className="border rounded-lg p-4 space-y-4 bg-card"
                    >
                      {/* Module Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{moduleName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {moduleConfig.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectAllModule(moduleName, !allSelected)}
                          >
                            {allSelected ? "Deselect All" : "Select All"}
                          </Button>
                        </div>
                      </div>

                      {/* Permission Checkboxes */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`${moduleName}-read`}
                            checked={modulePerms.read}
                            onCheckedChange={(checked) =>
                              handleModulePermissionChange(moduleName, "read", checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={`${moduleName}-read`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            Read (GET)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`${moduleName}-create`}
                            checked={modulePerms.create}
                            onCheckedChange={(checked) =>
                              handleModulePermissionChange(moduleName, "create", checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={`${moduleName}-create`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            Create (POST)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`${moduleName}-update`}
                            checked={modulePerms.update}
                            onCheckedChange={(checked) =>
                              handleModulePermissionChange(moduleName, "update", checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={`${moduleName}-update`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            Update (PUT/PATCH)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`${moduleName}-delete`}
                            checked={modulePerms.delete}
                            onCheckedChange={(checked) =>
                              handleModulePermissionChange(moduleName, "delete", checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={`${moduleName}-delete`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            Delete (DELETE)
                          </Label>
                        </div>
                      </div>

                      {/* Cross-Client Access */}
                      <div className="flex items-center space-x-2 pt-2 border-t">
                        <Checkbox
                          id={`${moduleName}-cross-client`}
                          checked={modulePerms.crossClient}
                          onCheckedChange={(checked) =>
                            handleModulePermissionChange(moduleName, "crossClient", checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`${moduleName}-cross-client`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          Cross-Client Access (Admin-like access to all clients)
                        </Label>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
