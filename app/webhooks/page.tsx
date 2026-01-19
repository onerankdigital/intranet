"use client"

import { useState } from "react"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { webhookApi } from "@/lib/api"

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

export default function WebhooksPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [response, setResponse] = useState<any>(null)

  const [verifyData, setVerifyData] = useState({
    "hub.mode": "",
    "hub.verify_token": "",
    "hub.challenge": "",
  })

  const [webhookData, setWebhookData] = useState("")

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setResponse(null)

    const response = await webhookApi.meta.verify(verifyData)
    
    if (response.error) {
      setMessage({ type: "error", text: response.error })
    } else {
      setResponse(response.data)
      setMessage({ type: "success", text: "Webhook verification successful!" })
    }
    setLoading(false)
  }

  const handleWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setResponse(null)

    try {
      const data = webhookData ? JSON.parse(webhookData) : {}
      const response = await webhookApi.meta.handle(data)
      
      if (response.error) {
        setMessage({ type: "error", text: response.error })
      } else {
        setResponse(response.data)
        setMessage({ type: "success", text: "Webhook handled successfully!" })
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Invalid JSON" })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground">
          Manage Meta (Facebook/Instagram) webhook verification and handling
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
          <CardTitle>Webhook Verification (GET)</CardTitle>
          <CardDescription>
            Meta webhook verification endpoint. Used for initial webhook setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hub.mode">Hub Mode</Label>
              <Input
                id="hub.mode"
                placeholder="subscribe"
                value={verifyData["hub.mode"]}
                onChange={(e) => setVerifyData({ ...verifyData, "hub.mode": e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hub.verify_token">Verify Token</Label>
              <Input
                id="hub.verify_token"
                placeholder="your_verify_token"
                value={verifyData["hub.verify_token"]}
                onChange={(e) => setVerifyData({ ...verifyData, "hub.verify_token": e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hub.challenge">Challenge</Label>
              <Input
                id="hub.challenge"
                placeholder="challenge_string"
                value={verifyData["hub.challenge"]}
                onChange={(e) => setVerifyData({ ...verifyData, "hub.challenge": e.target.value })}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify Webhook"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Handler (POST)</CardTitle>
          <CardDescription>
            Handle incoming webhook events from Meta platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleWebhook} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-data">Webhook Data (JSON)</Label>
              <Textarea
                id="webhook-data"
                className="min-h-[200px]"
                placeholder='{"object": "page", "entry": [...]}'
                value={webhookData}
                onChange={(e) => setWebhookData(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Handle Webhook"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResponse(null)}
              className="absolute right-6 top-6"
            >
              Close
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Field</TableHead>
                    <TableHead className="font-semibold">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(response).map(([key, value]) => {
                    const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    
                    return (
                      <TableRow key={key} className="table-row-3d">
                        <TableCell className="font-medium w-1/3">
                          <span className="text-sm">{displayKey}</span>
                        </TableCell>
                        <TableCell className="w-2/3">
                          {renderValue(value)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

