"use client"

import { useState, useEffect, useCallback } from "react"
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
import { clientApi } from "@/lib/api"
import { usePermissions } from "@/lib/use-permissions"
import { Users, Plus, RefreshCw, CheckCircle2, XCircle, Search, Eye, X, Building2, Edit, Trash2, Printer } from "lucide-react"

export default function ClientsPage() {
  const router = useRouter()
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    setLoading(true)
    const response = await clientApi.list()
    if (response.data) {
      setClients(Array.isArray(response.data) ? response.data : [])
    } else {
      setMessage({ type: "error", text: response.error || "Failed to fetch clients" })
    }
    setLoading(false)
  }


  const handleViewClient = (clientId: string) => {
    router.push(`/clients/${clientId}`)
  }

  const handleCreateClient = () => {
    router.push("/clients/new")
  }

  const handleEditClient = (clientId: string) => {
    router.push(`/clients/${clientId}/edit`)
  }

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete client "${clientName}" (${clientId})? This action cannot be undone.`)) {
      return
    }

    setLoading(true)
    setMessage(null)

    const response = await clientApi.delete(clientId)
    
    if (response.error) {
      setMessage({ type: "error", text: response.error || "Failed to delete client" })
    } else {
      setMessage({ type: "success", text: "Client deleted successfully!" })
      fetchClients()
    }
    setLoading(false)
  }

  const handlePrintOrderForm = async (client: any) => {
    // Fetch full client details to ensure we have all order_data
    let fullClient = client
    try {
      const response = await clientApi.get(client.client_id)
      if (response.data) {
        fullClient = response.data
      }
    } catch (error) {
      console.warn('Failed to fetch full client details, using list data:', error)
    }
    
    // Debug: log client data to see what we have
    console.log('Client data for print:', fullClient)
    console.log('Order data:', fullClient.order_data)
    
    // Build URL parameters from client data
    const params = new URLSearchParams()
    
    // Map client fields to order form fields
    // Company Name: prefer company_name, fallback to name
    const companyName = fullClient.company_name || fullClient.name
    if (companyName) params.set('companyName', companyName)
    
    // Contact Person
    if (fullClient.contact_person) params.set('contactPerson', fullClient.contact_person)
    
    // Designation
    if (fullClient.designation) params.set('designation', fullClient.designation)
    
    // Address: combine address, city, and state if available
    let fullAddress = fullClient.address || ''
    if (fullClient.city || fullClient.state) {
      const locationParts = [fullClient.city, fullClient.state].filter(Boolean).join(', ')
      if (fullAddress && locationParts) {
        fullAddress = `${fullAddress}, ${locationParts}`
      } else if (locationParts) {
        fullAddress = locationParts
      }
    }
    if (fullAddress) params.set('address', fullAddress)
    
    // Phone
    if (fullClient.phone) params.set('phone', fullClient.phone)
    
    // Email
    if (fullClient.email) params.set('email', fullClient.email)
    
    // Domain Name
    if (fullClient.domain_name) params.set('domainName', fullClient.domain_name)
    
    // GST Number
    if (fullClient.gst_no) params.set('gstNo', fullClient.gst_no)
    
    // Customer No: prefer customer_no, fallback to client_id
    const customerNo = fullClient.customer_no || fullClient.client_id
    if (customerNo) params.set('customerNo', customerNo)
    
    // Total Package: prefer total_amount, fallback to package_amount
    const totalPackage = fullClient.total_amount || fullClient.package_amount
    if (totalPackage) {
      const amount = typeof totalPackage === 'number' ? totalPackage.toString() : totalPackage
      params.set('totalPackage', amount)
    }
    
    // Date: prefer order_date if available, otherwise use current date
    let dateStr = ''
    if (fullClient.order_date) {
      // Parse order_date - handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm:ss" formats
      let dateValue = fullClient.order_date
      // Extract date part if it includes time (e.g., "2025-01-16T00:00:00" -> "2025-01-16")
      if (dateValue.includes('T')) {
        dateValue = dateValue.split('T')[0]
      }
      // Split by '-' to get YYYY, MM, DD
      const dateParts = dateValue.split('-')
      if (dateParts.length === 3) {
        dateStr = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
      }
    }
    if (!dateStr) {
      // Set current date as fallback
      const today = new Date()
      dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`
    }
    params.set('date', dateStr)
    
    // Services from order_data
    if (fullClient.order_data) {
      const orderData = fullClient.order_data
      
      // Get services array or service_codes array
      let services: string[] = []
      if (orderData.services && Array.isArray(orderData.services)) {
        // If services is array of objects, extract codes
        services = orderData.services.map((s: any) => s.code || s).filter(Boolean) as string[]
      } else if (orderData.service_codes && Array.isArray(orderData.service_codes)) {
        services = orderData.service_codes
      } else if (orderData.services && typeof orderData.services === 'string') {
        services = [orderData.services]
      }
      
      // Add services as comma-separated list
      if (services.length > 0) {
        params.set('services', services.join(','))
      }
      
      // Email services - collect all email services
      let emailServices: string[] = []
      if (orderData.email_services && Array.isArray(orderData.email_services)) {
        emailServices = [...orderData.email_services]
      }
      
      // Extract POP ID and G Suite ID from services array
      // Check both orderData.pop_id_count (if exists) and services array for quantity
      let popIdCount = null
      let gSuiteIdCount = null
      
      // First check if pop_id_count exists directly in order_data
      if (orderData.pop_id_count !== null && orderData.pop_id_count !== undefined && orderData.pop_id_count !== '') {
        popIdCount = orderData.pop_id_count
      }
      // Otherwise, check services array for pop-id with quantity
      else if (orderData.services && Array.isArray(orderData.services)) {
        const popIdService = orderData.services.find((s: any) => s.code === 'pop-id')
        if (popIdService && popIdService.quantity !== null && popIdService.quantity !== undefined && popIdService.quantity !== '') {
          popIdCount = popIdService.quantity
        }
      }
      
      // First check if g_suite_id_count exists directly in order_data
      if (orderData.g_suite_id_count !== null && orderData.g_suite_id_count !== undefined && orderData.g_suite_id_count !== '') {
        gSuiteIdCount = orderData.g_suite_id_count
      }
      // Otherwise, check services array for g-suite-id with quantity
      else if (orderData.services && Array.isArray(orderData.services)) {
        const gSuiteService = orderData.services.find((s: any) => s.code === 'g-suite-id')
        if (gSuiteService && gSuiteService.quantity !== null && gSuiteService.quantity !== undefined && gSuiteService.quantity !== '') {
          gSuiteIdCount = gSuiteService.quantity
        }
      }
      
      // Set POP ID count if found
      if (popIdCount !== null) {
        params.set('popIdCount', String(popIdCount))
        // Ensure "pop-id" is in email services list
        if (!emailServices.includes('pop-id')) {
          emailServices.push('pop-id')
        }
      }
      
      // Set G Suite ID count if found
      if (gSuiteIdCount !== null) {
        params.set('gSuiteIdCount', String(gSuiteIdCount))
        // Ensure "g-suite-id" is in email services list
        if (!emailServices.includes('g-suite-id')) {
          emailServices.push('g-suite-id')
        }
      }
      
      // Set email services param
      if (emailServices.length > 0) {
        params.set('emailServices', emailServices.join(','))
      }
      
      // Guidelines
      if (orderData.guidelines) {
        params.set('guidelines', orderData.guidelines)
      }
      
      // SEO data
      if (orderData.seo_keyword_range && Array.isArray(orderData.seo_keyword_range)) {
        params.set('seoKeywordRange', orderData.seo_keyword_range.join(','))
      }
      if (orderData.seo_location && Array.isArray(orderData.seo_location)) {
        params.set('seoLocation', orderData.seo_location.join(','))
      }
      if (orderData.seo_keywords_list) {
        params.set('seoKeywordsList', orderData.seo_keywords_list)
      }
      
      // Google Adwords data
      if (orderData.adwords_keywords) {
        params.set('adwordsKeywords', orderData.adwords_keywords)
      }
      if (orderData.adwords_period) {
        params.set('adwordsPeriod', orderData.adwords_period)
      }
      if (orderData.adwords_location) {
        params.set('adwordsLocation', orderData.adwords_location)
      }
      if (orderData.adwords_keywords_list) {
        params.set('adwordsKeywordsList', orderData.adwords_keywords_list)
      }
      
      // Special guidelines
      if (orderData.special_guidelines) {
        params.set('specialGuidelines', orderData.special_guidelines)
      }
    }
    
    // Open order form in new window/tab with client data
    const orderFormUrl = `/orderform/final.html?${params.toString()}`
    window.open(orderFormUrl, '_blank')
  }

  const filteredClients = clients.filter((client) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      client.client_id?.toLowerCase().includes(query) ||
      client.name?.toLowerCase().includes(query) ||
      client.status?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
              <p className="text-muted-foreground">
                Manage your clients and their settings
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchClients}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canCreate("Clients") && (
            <Button 
              type="button"
              onClick={handleCreateClient} 
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Client
            </Button>
          )}
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


      {/* Clients List */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                All Clients
              </CardTitle>
              <CardDescription className="mt-1">
                {clients.length} client{clients.length !== 1 ? "s" : ""} registered in the system
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredClients.length} shown
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by client ID, name, or status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 input-3d"
                  />
            </div>
          </div>

          {/* Loading State */}
          {loading && clients.length === 0 ? (
            <Loader text="Loading clients..." />
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">
                {searchQuery ? "No clients match your search" : "No clients found"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? "Try a different search term" : "Create one to get started"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Client ID</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Total Amount</TableHead>
                    <TableHead className="font-semibold">Premium</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow 
                      key={client.client_id || client.id} 
                      className="table-row-3d"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <code className="text-sm font-mono font-semibold">
                            {client.client_id || client.id}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{client.name || "N/A"}</span>
                      </TableCell>
                      <TableCell>
                        {client.total_amount ? (
                          <span className="font-semibold text-green-600">
                            ₹{parseFloat(client.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.is_premium ? (
                          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                            Premium
                          </Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.status === "active" ? "default" : client.status === "suspended" ? "destructive" : "secondary"}>
                          {client.status || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewClient(client.client_id || client.id)}
                            className="gap-2"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintOrderForm(client)}
                            className="gap-2"
                            title="Print Order Form"
                          >
                            <Printer className="h-3 w-3" />
                            Print
                          </Button>
                          {canUpdate("Clients") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClient(client.client_id || client.id)}
                              className="gap-2"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                          )}
                          {canDelete("Clients") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClient(client.client_id || client.id, client.name || "Unknown")}
                              className="gap-2 text-destructive hover:text-destructive"
                              disabled={loading}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          )}
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

