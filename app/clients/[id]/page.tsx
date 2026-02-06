"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { clientApi, transactionApi } from "@/lib/api"
import { Building2, ArrowLeft, CheckCircle2, XCircle, Receipt, IndianRupee, Calendar, Phone, Mail, MapPin, Globe, FileText, Settings, List, MessageSquare, Table as TableIcon, RefreshCw } from "lucide-react"

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<any>(null)
  const [balance, setBalance] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [integration, setIntegration] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [savingIntegration, setSavingIntegration] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (clientId) {
      fetchClient()
      fetchBalance()
      fetchTransactions()
      fetchIntegration()
    }
  }, [clientId])

  const fetchClient = async () => {
    setLoading(true)
    const response = await clientApi.get(clientId)
    if (response.data) {
      setClient(response.data)
    } else {
      setMessage({ type: "error", text: response.error || "Failed to fetch client" })
    }
    setLoading(false)
  }

  const fetchBalance = async () => {
    const response = await clientApi.getBalance(clientId)
    if (response.data) {
      setBalance(response.data)
    }
  }

  const fetchTransactions = async () => {
    const response = await transactionApi.list({ client_id: clientId })
    if (response.data) {
      setTransactions(Array.isArray(response.data) ? response.data : [])
    }
  }

  const fetchIntegration = async () => {
    try {
      const response = await clientApi.getIntegration(clientId)
      if (response.data) {
        setIntegration(response.data)
      }
    } catch (error: any) {
      // If integration doesn't exist yet, that's okay - it will be created automatically
      if (error?.response?.status !== 404) {
        console.error("Failed to fetch integration:", error)
      }
    }
  }

  const handleUpdateIntegration = async (field: string, value: string) => {
    if (!integration) return
    
    setSavingIntegration(true)
    setMessage(null)
    
    try {
      const updateData = { [field]: value }
      const response = await clientApi.updateIntegration(clientId, updateData)
      
      if (response.error) {
        setMessage({ type: "error", text: response.error })
      } else {
        setMessage({ type: "success", text: "Integration settings updated successfully!" })
        // Update local state
        setIntegration({ ...integration, [field]: value })
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update integration settings" })
    } finally {
      setSavingIntegration(false)
    }
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

  if (!client) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Client not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
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

      {/* Balance Summary */}
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg font-semibold">Payment Balance</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBalance}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {balance ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Total Amount</div>
                <div className="text-2xl font-bold text-green-600">
                  ₹{balance.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                </div>
                <div className="text-xs text-muted-foreground">Order total amount</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Paid Amount</div>
                <div className="text-2xl font-bold text-blue-600">
                  ₹{balance.paid_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {balance.transactions_count || 0} verified transaction{balance.transactions_count !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Remaining Balance</div>
                <div className="text-2xl font-bold text-orange-600">
                  ₹{balance.remaining_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                </div>
                <div className="text-xs text-muted-foreground">Amount still due</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Loading balance...
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Client Details</TabsTrigger>
          <TabsTrigger value="order">Order Information</TabsTrigger>
          <TabsTrigger value="services">Services & Instructions</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Client Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Client Information
              </CardTitle>
              <CardDescription>Basic client information</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs text-muted-foreground">Client ID</Label>
                  <code className="text-sm font-mono font-semibold mt-1 block p-2 bg-muted rounded">
                    {client.client_id || client.id}
                  </code>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={client.status === "active" ? "default" : client.status === "suspended" ? "destructive" : "secondary"}>
                      {client.status || "N/A"}
                    </Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Client Name / Company Name</Label>
                  <p className="text-sm font-semibold mt-1">{client.name || client.company_name || "N/A"}</p>
                </div>
                {client.logo && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Company Logo</Label>
                    <div className="mt-2">
                      <img 
                        src={(() => {
                          if (!client.logo?.startsWith('/static/images')) {
                            return client.logo
                          }
                          // Get API base URL dynamically
                          const apiBaseUrl = typeof window !== 'undefined' 
                            ? (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                                ? `http://${window.location.hostname}:8000`
                                : 'http://localhost:8000')
                            : 'http://localhost:8000'
                          return `${apiBaseUrl}${client.logo}`
                        })()}
                        alt="Company Logo" 
                        className="h-32 w-32 object-contain border rounded-lg p-2 bg-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                )}
                {client.description && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Company Description</Label>
                    <div className="mt-2 p-4 bg-muted/50 rounded-lg border">
                      <p className="text-sm whitespace-pre-wrap">{client.description}</p>
                    </div>
                  </div>
                )}
                {client.contact_person && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Contact Person</Label>
                    <p className="text-sm font-semibold mt-1">{client.contact_person}</p>
                  </div>
                )}
                {client.designation && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Designation</Label>
                    <p className="text-sm font-semibold mt-1">{client.designation}</p>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      Phone
                    </Label>
                    <p className="text-sm font-semibold mt-1">{client.phone}</p>
                  </div>
                )}
                {client.email && (
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Email
                    </Label>
                    <p className="text-sm font-semibold mt-1">{client.email}</p>
                  </div>
                )}
                {client.address && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      Address
                    </Label>
                    <p className="text-sm font-semibold mt-1">{client.address}</p>
                  </div>
                )}
                {client.domain_name && (
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      Domain Name
                    </Label>
                    <p className="text-sm font-semibold mt-1">{client.domain_name}</p>
                  </div>
                )}
                {client.gst_no && (
                  <div>
                    <Label className="text-xs text-muted-foreground">GSTIN No.</Label>
                    <p className="text-sm font-semibold mt-1">{client.gst_no}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Information Tab */}
        <TabsContent value="order" className="space-y-4">
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Order & Payment Details
              </CardTitle>
              <CardDescription>Order form information and payment breakdown</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {client.customer_no && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Customer No.</Label>
                    <p className="text-sm font-semibold mt-1">{client.customer_no}</p>
                  </div>
                )}
                {client.order_date && (
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Order Date
                    </Label>
                    <p className="text-sm font-semibold mt-1">
                      {new Date(client.order_date).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                )}
                {client.package_amount && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Package Amount</Label>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      ₹{parseFloat(client.package_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                {client.gst_amount && (
                  <div>
                    <Label className="text-xs text-muted-foreground">GST (18%)</Label>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      ₹{parseFloat(client.gst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                {client.total_amount && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Total Amount</Label>
                    <p className="text-2xl font-bold text-primary mt-1">
                      ₹{parseFloat(client.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services & Special Instructions Tab */}
        <TabsContent value="services" className="space-y-4">
          {/* Services */}
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5 text-primary" />
                Selected Services
              </CardTitle>
              <CardDescription>Services assigned to this client</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {client.order_data?.services ? (
                <div className="space-y-2">
                  {Array.isArray(client.order_data.services) && client.order_data.services.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2">
                      {client.order_data.services.map((service: any, index: number) => {
                        // Handle both old format (string) and new format (object with code, name, quantity)
                        const serviceName = typeof service === 'string' 
                          ? service 
                          : (service.name || service.code || 'Unknown Service')
                        const quantity = typeof service === 'object' && service.quantity !== undefined 
                          ? service.quantity 
                          : null
                        
                        return (
                          <li key={index} className="text-sm">
                            {serviceName}
                            {quantity !== null && (
                              <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-md font-semibold">
                                Qty: {quantity}
                              </span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No services selected</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No service information available</p>
              )}
            </CardContent>
          </Card>

          {/* Guidelines */}
          {client.order_data?.guidelines && (
            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle>Specific Guidelines</CardTitle>
                <CardDescription>Website & SEO specific guidelines</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Guidelines (Website & SEO)</Label>
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm whitespace-pre-wrap">{client.order_data.guidelines}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SEO Instructions */}
          {(client.order_data?.seo_keyword_range || client.order_data?.seo_location || client.order_data?.seo_keywords_list) && (
            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle>Search Engine Optimization (SEO)</CardTitle>
                <CardDescription>SEO configuration and keywords</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {client.order_data.seo_keyword_range && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Keyword Range</Label>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(client.order_data.seo_keyword_range) && client.order_data.seo_keyword_range.map((range: string, index: number) => (
                        <Badge key={index} variant="secondary">{range}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {client.order_data.seo_location && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(client.order_data.seo_location) && client.order_data.seo_location.map((location: string, index: number) => (
                        <Badge key={index} variant="secondary">{location}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {client.order_data.seo_keywords_list && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Top Products / Keywords</Label>
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <p className="text-sm whitespace-pre-wrap font-mono">{client.order_data.seo_keywords_list}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Google Adwords */}
          {(client.order_data?.adwords_keywords || client.order_data?.adwords_period || client.order_data?.adwords_location || client.order_data?.adwords_keywords_list) && (
            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle>Google Adwords</CardTitle>
                <CardDescription>Google Ads configuration</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.order_data.adwords_keywords && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Number of Keywords</Label>
                      <p className="text-sm font-semibold mt-1">{client.order_data.adwords_keywords}</p>
                    </div>
                  )}
                  {client.order_data.adwords_period && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Period</Label>
                      <p className="text-sm font-semibold mt-1">{client.order_data.adwords_period}</p>
                    </div>
                  )}
                </div>
                {client.order_data.adwords_location && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <p className="text-sm font-semibold mt-1">{client.order_data.adwords_location}</p>
                  </div>
                )}
                {client.order_data.adwords_keywords_list && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Keywords</Label>
                    <div className="p-4 bg-muted/50 rounded-lg border mt-1">
                      <p className="text-sm whitespace-pre-wrap font-mono">{client.order_data.adwords_keywords_list}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Special Guidelines */}
          {client.order_data?.special_guidelines && (
            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle>Special Guidelines</CardTitle>
                <CardDescription>Additional special instructions</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Special Guidelines</Label>
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm whitespace-pre-wrap">{client.order_data.special_guidelines}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Integration Settings
              </CardTitle>
              <CardDescription>Configure WhatsApp, Google Sheets, and other integrations</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {!integration ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground font-medium">Loading integration settings...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* WhatsApp Integration */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                        <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">WhatsApp Notifications</h3>
                        <p className="text-sm text-muted-foreground">
                          Send WhatsApp messages when new leads are received
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integration.whatsapp_enabled === "true"}
                        onChange={(e) => handleUpdateIntegration("whatsapp_enabled", e.target.checked ? "true" : "false")}
                        disabled={savingIntegration}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Google Sheets Integration */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                        <TableIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Google Sheets</h3>
                        <p className="text-sm text-muted-foreground">
                          Automatically append leads to Google Sheets
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integration.google_sheets_enabled === "true"}
                        onChange={(e) => handleUpdateIntegration("google_sheets_enabled", e.target.checked ? "true" : "false")}
                        disabled={savingIntegration}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Google Sheet ID (if enabled) */}
                  {integration.google_sheets_enabled === "true" && (
                    <div className="space-y-2">
                      <Label htmlFor="google_sheet_id" className="text-sm font-semibold">
                        Google Sheet ID
                      </Label>
                      <Input
                        id="google_sheet_id"
                        placeholder="Enter Google Sheet ID"
                        value={integration.google_sheet_id || ""}
                        onChange={(e) => setIntegration({ ...integration, google_sheet_id: e.target.value })}
                        onBlur={() => {
                          if (integration.google_sheet_id !== undefined) {
                            handleUpdateIntegration("google_sheet_id", integration.google_sheet_id || "")
                          }
                        }}
                        disabled={savingIntegration}
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        The Sheet ID from your Google Sheets URL (e.g., from https://docs.google.com/spreadsheets/d/SHEET_ID/edit)
                      </p>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> When WhatsApp is enabled, notifications will be sent to the client's phone number ({client?.phone || "not set"}) when new leads are received.
                      Make sure the client's phone number is correctly set in the Client Details tab.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Transaction History
              </CardTitle>
              <CardDescription>All payment transactions for this client</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground font-medium">No transactions found</p>
                  <p className="text-sm text-muted-foreground mt-1">Transactions will appear here once created</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Transaction ID</TableHead>
                        <TableHead className="font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <code className="text-sm font-mono">{transaction.transaction_id}</code>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">
                              ₹{parseFloat(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge 
                                variant={
                                  transaction.status === "verified" ? "default" : 
                                  transaction.status === "rejected" ? "destructive" : 
                                  "secondary"
                                }
                              >
                                {transaction.status}
                              </Badge>
                              {transaction.status === "rejected" && transaction.rejection_reason && (
                                <div className="text-xs text-muted-foreground mt-1 max-w-xs">
                                  <span className="font-medium text-destructive">Reason: </span>
                                  {transaction.rejection_reason}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.created_at).toLocaleDateString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {transaction.notes || "-"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
