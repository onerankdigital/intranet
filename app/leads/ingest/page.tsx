"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { leadApi } from "@/lib/api"
import { Plus, CheckCircle2, XCircle, ArrowLeft } from "lucide-react"

export default function IngestLeadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [ingestData, setIngestData] = useState({
    client_id: "",
    name: "",
    email: "",
    phone: "",
    source: "website",
    api_key: "",
  })

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { api_key, ...leadData } = ingestData
      const result = await leadApi.ingest(leadData, api_key || undefined)
      
      if (result.error || result.detail) {
        setMessage({ type: "error", text: result.error || result.detail || "Failed to ingest lead" })
      } else {
        setMessage({ type: "success", text: "Lead ingested successfully!" })
        setIngestData({
          client_id: "",
          name: "",
          email: "",
          phone: "",
          source: "website",
          api_key: "",
        })
        // Optionally redirect after a delay
        setTimeout(() => {
          router.push("/leads")
        }, 2000)
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Network error" })
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Ingest Lead</h1>
              <p className="text-muted-foreground">
                Add a new lead via API key authentication
              </p>
            </div>
          </div>
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

      {/* Ingest Form */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Lead Information
          </CardTitle>
          <CardDescription>Fill in the details to ingest a new lead</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleIngest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key (Optional)</Label>
              <Input
                id="api_key"
                type="text"
                placeholder="Leave empty if not using API key"
                value={ingestData.api_key}
                onChange={(e) => setIngestData({ ...ingestData, api_key: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_id">Client ID *</Label>
              <Input
                id="client_id"
                placeholder="CLIENT-ACME-001"
                value={ingestData.client_id}
                onChange={(e) => setIngestData({ ...ingestData, client_id: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={ingestData.name}
                onChange={(e) => setIngestData({ ...ingestData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={ingestData.email}
                onChange={(e) => setIngestData({ ...ingestData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={ingestData.phone}
                onChange={(e) => setIngestData({ ...ingestData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder="website"
                value={ingestData.source}
                onChange={(e) => setIngestData({ ...ingestData, source: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Ingesting..." : "Ingest Lead"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/leads")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

