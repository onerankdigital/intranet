"use client"

import { useState, useEffect } from "react"
import { hierarchyApi, userClientApi, clientApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function HierarchyPage() {
  const [clients, setClients] = useState<any[]>([])
  const [userClients, setUserClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedUserClient, setSelectedUserClient] = useState<string>("")
  const [hierarchyTree, setHierarchyTree] = useState<any>(null)
  const [descendants, setDescendants] = useState<string[]>([])
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadUserClients()
    }
  }, [selectedClient])

  useEffect(() => {
    if (selectedUserClient) {
      loadHierarchyTree()
      loadDescendants()
    }
  }, [selectedUserClient])

  const loadClients = async () => {
    try {
      const response = await clientApi.list()
      if (response.data) {
        setClients(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load clients" })
    }
  }

  const loadUserClients = async () => {
    try {
      const response = await userClientApi.list({ client_id: selectedClient })
      if (response.data) {
        setUserClients(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load user-clients" })
    }
  }

  const loadHierarchyTree = async () => {
    if (!selectedUserClient) return
    try {
      const response = await hierarchyApi.getTree(selectedUserClient)
      if (response.data) {
        setHierarchyTree(response.data)
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load hierarchy tree" })
    }
  }

  const loadDescendants = async () => {
    if (!selectedUserClient) return
    try {
      const response = await hierarchyApi.getDescendants(selectedUserClient, false)
      if (response.data) {
        setDescendants(Array.isArray(response.data) ? response.data : [])
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load descendants" })
    }
  }

  const handleRebuild = async () => {
    if (!selectedClient) {
      setMessage({ type: "error", text: "Please select a client" })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const response = await hierarchyApi.rebuild(selectedClient)
      if (response.data) {
        interface RebuildResponse {
          message?: string
          [key: string]: any
        }
        const data = response.data as RebuildResponse
        setMessage({ type: "success", text: data.message || "Hierarchy rebuilt successfully" })
        if (selectedUserClient) {
          loadHierarchyTree()
          loadDescendants()
        }
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to rebuild hierarchy" })
    } finally {
      setLoading(false)
    }
  }

  const renderTree = (node: any, depth: number = 0): React.ReactElement => {
    const nodeId = String(node.user_client_id || node.id || 'unknown')
    const displayId = nodeId.length > 8 ? nodeId.substring(0, 8) + '...' : nodeId
    return (
      <div key={nodeId} className="ml-4 border-l-2 border-gray-300 pl-4">
        <div className="flex items-center gap-2 py-1">
          <span className="font-medium">User Client: {displayId}</span>
          {node.depth !== undefined && (
            <span className="text-sm text-gray-500">(Depth: {node.depth})</span>
          )}
        </div>
        {node.children && node.children.length > 0 && (
          <div className="mt-2">
            {node.children.map((child: any) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hierarchy Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage hierarchical RBAC and view organization structure
          </p>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rebuild Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle>Rebuild Hierarchy</CardTitle>
            <CardDescription>
              Rebuild the hierarchy closure table for a client
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rebuild-client">Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger id="rebuild-client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.client_id} value={client.client_id}>
                      {client.name} ({client.client_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleRebuild} disabled={loading || !selectedClient}>
              {loading ? "Rebuilding..." : "Rebuild Hierarchy"}
            </Button>
          </CardContent>
        </Card>

        {/* View Hierarchy Tree */}
        <Card>
          <CardHeader>
            <CardTitle>View Hierarchy Tree</CardTitle>
            <CardDescription>
              View the hierarchy tree starting from a user-client
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tree-client">Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger id="tree-client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.client_id} value={client.client_id}>
                      {client.name} ({client.client_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tree-user-client">User-Client</Label>
              <Select value={selectedUserClient} onValueChange={setSelectedUserClient}>
                <SelectTrigger id="tree-user-client">
                  <SelectValue placeholder="Select a user-client" />
                </SelectTrigger>
                <SelectContent>
                  {userClients.map((uc) => {
                    const ucId = uc.id || `${uc.user_id}-${uc.client_id}` || 'unknown'
                    return (
                      <SelectItem key={ucId} value={ucId}>
                        User-Client: {ucId && ucId.length > 8 ? ucId.substring(0, 8) + '...' : ucId}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchy Tree Display */}
      {hierarchyTree && (
        <Card>
          <CardHeader>
            <CardTitle>Hierarchy Tree</CardTitle>
            <CardDescription>
              Organization structure starting from selected user-client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {renderTree(hierarchyTree)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Descendants List */}
      {descendants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Descendants</CardTitle>
            <CardDescription>
              All user-clients in the hierarchy subtree
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {descendants.map((id) => (
                <div key={id} className="text-sm font-mono">
                  {id}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

