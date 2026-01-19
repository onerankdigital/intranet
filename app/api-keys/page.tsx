"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiKeyApi, clientApi } from "@/lib/api"
import { Key, Plus, RefreshCw, CheckCircle2, XCircle, Search, Copy, Eye, EyeOff, AlertTriangle, Trash2, Power, PowerOff } from "lucide-react"

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterClientId, setFilterClientId] = useState<string>("")

  const [createData, setCreateData] = useState({
    client_id: "",
    scopes: ["leads:create"],
    expires_at: "",
  })

  useEffect(() => {
    fetchAPIKeys()
    fetchClients()
  }, [])

  useEffect(() => {
    if (filterClientId) {
      fetchAPIKeys(filterClientId)
    } else {
      fetchAPIKeys()
    }
  }, [filterClientId])

  const fetchAPIKeys = async (clientId?: string) => {
    setLoading(true)
    const response = await apiKeyApi.list(clientId)
    if (response.data) {
      setApiKeys(Array.isArray(response.data) ? response.data : [])
    } else {
      setMessage({ type: "error", text: response.error || "Failed to fetch API keys" })
    }
    setLoading(false)
  }

  const fetchClients = async () => {
    const response = await clientApi.list()
    if (response.data) {
      setClients(Array.isArray(response.data) ? response.data : [])
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setNewApiKey(null)

    const payload: any = {
      client_id: createData.client_id,
      scopes: createData.scopes,
    }
    if (createData.expires_at) {
      payload.expires_at = createData.expires_at
    }

    const response = await apiKeyApi.generate(payload)
    
    if (response.error) {
      setMessage({ type: "error", text: response.error })
    } else {
      setMessage({ type: "success", text: "API key generated successfully! Save it now - it won't be shown again." })
      setNewApiKey(response.data?.api_key || null)
      setShowApiKey(true)
      setCreateData({ client_id: "", scopes: ["leads:create"], expires_at: "" })
      fetchAPIKeys()
    }
    setLoading(false)
  }

  const copyToClipboard = async (text: string) => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        setMessage({ type: "success", text: "API key copied to clipboard!" })
      } else {
        // Fallback: Use legacy clipboard method
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand("copy")
          setMessage({ type: "success", text: "API key copied to clipboard!" })
        } catch (err) {
          setMessage({ type: "error", text: "Failed to copy to clipboard" })
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      // Fallback: Use legacy clipboard method
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        setMessage({ type: "success", text: "API key copied to clipboard!" })
      } catch (fallbackErr) {
        setMessage({ type: "error", text: "Failed to copy to clipboard. Please copy manually." })
      } finally {
        document.body.removeChild(textArea)
      }
    }
    setTimeout(() => setMessage(null), 2000)
  }

  const handleDisable = async (apiKeyId: string, currentStatus: string) => {
    if (!confirm(`Are you sure you want to ${currentStatus === "active" ? "disable" : "enable"} this API key?`)) {
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    const newStatus = currentStatus === "active" ? "disabled" : "active"
    const response = await apiKeyApi.update(apiKeyId, { status: newStatus })
    
    if (response.error) {
      setMessage({ type: "error", text: response.error })
    } else {
      setMessage({ type: "success", text: `API key ${newStatus === "active" ? "enabled" : "disabled"} successfully` })
      fetchAPIKeys(filterClientId || undefined)
    }
    
    setLoading(false)
  }

  const handleDelete = async (apiKeyId: string, keyPrefix: string) => {
    if (!confirm(`Are you sure you want to delete API key "${keyPrefix}..."? This action cannot be undone.`)) {
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    const response = await apiKeyApi.delete(apiKeyId)
    
    if (response.error) {
      setMessage({ type: "error", text: response.error })
    } else {
      setMessage({ type: "success", text: "API key deleted successfully" })
      fetchAPIKeys(filterClientId || undefined)
    }
    
    setLoading(false)
  }

  const filteredAPIKeys = apiKeys.filter((key) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      key.client_id?.toLowerCase().includes(query) ||
      key.key_prefix?.toLowerCase().includes(query) ||
      key.status?.toLowerCase().includes(query)
    )
  })

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
              <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
              <p className="text-muted-foreground">
                Generate and manage API keys for lead ingestion from client websites
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchAPIKeys(filterClientId || undefined)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
            <Plus className="h-4 w-4" />
            {showCreate ? "Cancel" : "Generate API Key"}
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

      {/* New API Key Display */}
      {newApiKey && showApiKey && (
        <Alert className="border-2 border-primary/50 bg-primary/5">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <AlertDescription className="space-y-3">
            <div className="font-semibold text-primary">⚠️ Save this API key now - it won't be shown again!</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-background border rounded-lg font-mono text-sm break-all">
                {newApiKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(newApiKey)}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowApiKey(false)
                  setNewApiKey(null)
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
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
              Generate API Key
            </CardTitle>
            <CardDescription>Create a new API key for lead ingestion from client websites</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="client_id" className="text-sm font-semibold">
                  Client *
                </Label>
                <Select
                  value={createData.client_id}
                  onValueChange={(value) => setCreateData({ ...createData, client_id: value })}
                >
                  <SelectTrigger id="client_id" className="h-11">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.client_id || client.id} value={client.client_id || client.id}>
                        {client.client_id || client.id} - {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="scopes" className="text-sm font-semibold">
                  Scopes
                </Label>
                <Input
                  id="scopes"
                  placeholder="leads:create (comma-separated)"
                  value={createData.scopes.join(", ")}
                  onChange={(e) => setCreateData({ ...createData, scopes: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Default: leads:create
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expires_at" className="text-sm font-semibold">
                  Expires At (Optional)
                </Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={createData.expires_at}
                  onChange={(e) => setCreateData({ ...createData, expires_at: e.target.value })}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no expiration
                </p>
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      Generate API Key
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreate(false)
                    setCreateData({ client_id: "", scopes: ["leads:create"], expires_at: "" })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                All API Keys
              </CardTitle>
              <CardDescription className="mt-1">
                {apiKeys.length} API key{apiKeys.length !== 1 ? "s" : ""} registered
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredAPIKeys.length} shown
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client ID, prefix, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 input-3d"
              />
            </div>
            <Select value={filterClientId || "all"} onValueChange={(value) => setFilterClientId(value === "all" ? "" : value)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Filter by client..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.client_id || client.id} value={client.client_id || client.id}>
                    {client.client_id || client.id} - {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading && apiKeys.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-40" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-24" />
                </div>
              ))}
            </div>
          ) : filteredAPIKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">
                {searchQuery || filterClientId ? "No API keys match your filters" : "No API keys found"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || filterClientId ? "Try different filters" : "Generate one to get started"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border ">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Client ID</TableHead>
                    <TableHead className="font-semibold">Key Prefix</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Expires At</TableHead>
                    <TableHead className="font-semibold">Last Used</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAPIKeys.map((key) => (
                    <TableRow key={key.id} className="table-row-3d">
                      <TableCell>
                        <code className="text-sm font-mono font-semibold">
                          {key.client_id}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground font-mono">
                          {key.key_prefix}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={key.status === "active" ? "success" : "secondary"} >
                          {key.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {key.expires_at ? (
                          <span className="text-sm">
                            {new Date(key.expires_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {key.last_used_at ? (
                          <span className="text-sm">
                            {new Date(key.last_used_at).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisable(key.id, key.status)}
                            disabled={loading}
                            className="gap-1"
                            title={key.status === "active" ? "Disable" : "Enable"}
                          >
                            {key.status === "active" ? (
                              <>
                                <PowerOff className="h-3 w-3" />
                                Disable
                              </>
                            ) : (
                              <>
                                <Power className="h-3 w-3" />
                                Enable
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(key.id, key.key_prefix)}
                            disabled={loading}
                            className="gap-1"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
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

