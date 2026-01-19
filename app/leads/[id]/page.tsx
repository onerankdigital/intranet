"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { leadApi } from "@/lib/api"
import { FileText, ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Helper function to render nested values as tables
const renderValue = (value: any, depth: number = 0): React.ReactNode => {
  if (depth > 3) {
    // Prevent infinite recursion, show as string for very deep nesting
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

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const leadId = params.id as string

  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (leadId) {
      fetchLead()
    }
  }, [leadId])

  const fetchLead = async () => {
    setLoading(true)
    const response = await leadApi.get(leadId)
    if (response.data) {
      setLead(response.data)
    } else {
      setMessage({ type: "error", text: response.error || "Failed to fetch lead" })
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Lead not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleBack = () => {
    // Check if we have a return URL in sessionStorage
    if (typeof window !== 'undefined') {
      const returnUrl = sessionStorage.getItem('leadReturnUrl')
      if (returnUrl) {
        sessionStorage.removeItem('leadReturnUrl')
        router.push(returnUrl)
      } else {
        // Default to leads page
        router.push('/leads')
      }
    } else {
      router.push('/leads')
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={handleBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Button>

      {/* Message Alert */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Lead Details */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Lead Details
          </CardTitle>
          <CardDescription>Complete information about the selected lead</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Lead ID</Label>
                <code className="text-sm font-mono font-semibold mt-1 block p-2 bg-muted rounded">
                  {lead.id || lead.lead_id}
                </code>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Client ID</Label>
                <code className="text-sm font-mono font-semibold mt-1 block p-2 bg-muted rounded">
                  {lead.client_id}
                </code>
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="text-sm font-semibold mt-1">{lead.name || "N/A"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm mt-1">{lead.email || "N/A"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <p className="text-sm mt-1">{lead.phone || "N/A"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Source</Label>
                <div className="mt-1">
                  <Badge variant="secondary">{lead.source || "N/A"}</Badge>
                </div>
              </div>
              {lead.created_at && (
                <div>
                  <Label className="text-xs text-muted-foreground">Created At</Label>
                  <p className="text-sm mt-1">
                    {new Date(lead.created_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            {lead.raw_payload && (
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground mb-2 block">Additional Information</Label>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Field</TableHead>
                        <TableHead className="font-semibold">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(lead.raw_payload)
                        .filter(([key]) => {
                          // Filter out system/security fields that shouldn't be displayed
                          // form_timestamp is allowed (will be formatted)
                          const hiddenFields = [
                            'captcha_id',
                            'captcha_text',
                            'csrf_token',
                            '_field_labels',
                            'js_token',
                            'website_url' // honeypot field
                          ]
                          return !hiddenFields.includes(key)
                        })
                        .map(([key, value]) => {
                          // Format key for display
                          const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                          
                          // Format form_timestamp if present (Unix timestamp in seconds)
                          let displayValue = value
                          if (key === 'form_timestamp' && value) {
                            try {
                              const timestamp = typeof value === 'number' ? value : parseInt(String(value))
                              if (!isNaN(timestamp) && timestamp > 0) {
                                // Convert Unix timestamp (seconds) to Date
                                displayValue = new Date(timestamp * 1000).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: true
                                })
                              } else {
                                displayValue = 'Invalid timestamp'
                              }
                            } catch (e) {
                              displayValue = String(value)
                            }
                          }
                          
                          return (
                            <TableRow key={key} className="table-row-3d">
                              <TableCell className="font-medium w-1/3">
                                <span className="text-sm">{displayKey}</span>
                              </TableCell>
                              <TableCell className="w-2/3">
                                {key === 'form_timestamp' && typeof displayValue === 'string' 
                                  ? <span className="text-sm">{displayValue}</span>
                                  : renderValue(displayValue)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

