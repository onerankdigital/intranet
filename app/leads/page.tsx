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
import { leadApi, clientApi } from "@/lib/api"
import { FileText, Search, Eye, ChevronLeft, ChevronRight, Calendar, X } from "lucide-react"

export default function LeadsPage() {
  const router = useRouter()
  const [allLeads, setAllLeads] = useState<any[]>([])
  const [filteredLeads, setFilteredLeads] = useState<any[]>([])
  const [displayedLeads, setDisplayedLeads] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    client_id: "",
    client_name: "",
    domain: ""
  })
  
  // Results view state
  const [showResults, setShowResults] = useState(false)
  const [filterSource, setFilterSource] = useState("")
  const [showOrdPanelLeads, setShowOrdPanelLeads] = useState(false) // Toggle for ordpanel leads view
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  
  // Autocomplete suggestions
  const [clientIdSuggestions, setClientIdSuggestions] = useState<string[]>([])
  const [clientNameSuggestions, setClientNameSuggestions] = useState<string[]>([])
  const [domainSuggestions, setDomainSuggestions] = useState<string[]>([])
  const [sourceSuggestions, setSourceSuggestions] = useState<string[]>([])
  
  // Autocomplete visibility
  const [showClientIdSuggestions, setShowClientIdSuggestions] = useState(false)
  const [showClientNameSuggestions, setShowClientNameSuggestions] = useState(false)
  const [showDomainSuggestions, setShowDomainSuggestions] = useState(false)
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  useEffect(() => {
    fetchLeads()
    fetchClients()
    
    // Check if we should show results view from URL params
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('view') === 'results') {
        // Try to restore form data from sessionStorage
        const savedFormData = sessionStorage.getItem('leadFormData')
        if (savedFormData) {
          try {
            const formData = JSON.parse(savedFormData)
            setFormData(formData)
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }, [])

  // Restore results view after leads are loaded
  useEffect(() => {
    if (allLeads.length > 0 && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('view') === 'results') {
        const savedFormData = sessionStorage.getItem('leadFormData')
        if (savedFormData && !showResults) {
          try {
            const formData = JSON.parse(savedFormData)
            // Re-apply the search to show results
            let filtered = [...allLeads]

            if (formData.client_id) {
              filtered = filtered.filter((lead) => 
                lead.client_id?.toLowerCase().includes(formData.client_id.toLowerCase())
              )
            }

            if (formData.client_name) {
              filtered = filtered.filter((lead) => {
                const client = clients.find(c => c.client_id === lead.client_id)
                return client?.name?.toLowerCase().includes(formData.client_name.toLowerCase())
              })
            }

            if (formData.domain) {
              filtered = filtered.filter((lead) => {
                const domain = lead.raw_payload?.domain || ''
                return domain.toLowerCase().includes(formData.domain.toLowerCase())
              })
            }

            setFilteredLeads(filtered)
            setShowResults(true)
            updateSuggestions(filtered, clients)
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }, [allLeads, clients])

  // Update suggestions when both leads and clients are available
  useEffect(() => {
    if (allLeads.length > 0 && clients.length > 0) {
      updateSuggestions(allLeads, clients)
    }
  }, [allLeads.length, clients.length])

  useEffect(() => {
    if (showResults) {
      applyResultsFilters()
    }
  }, [filterSource, dateFrom, dateTo, filteredLeads, currentPage])

  const fetchLeads = async () => {
    setLoading(true)
    const response = await leadApi.list()
    if (response.data) {
      const leadsData = Array.isArray(response.data) ? response.data : []
      setAllLeads(leadsData)
      // Update suggestions with current clients list
      updateSuggestions(leadsData, clients)
    } else {
      setMessage({ type: "error", text: response.error || "Failed to fetch leads" })
    }
    setLoading(false)
  }

  const fetchClients = async () => {
    const response = await clientApi.list()
    if (response.data) {
      const clientsData = Array.isArray(response.data) ? response.data : []
      setClients(clientsData)
      // Update suggestions after clients are loaded
      if (allLeads.length > 0) {
        updateSuggestions(allLeads, clientsData)
      }
    }
  }

  const updateSuggestions = (leads = allLeads, clientsList = clients) => {
    if (leads.length === 0) return
    
    const uniqueClientIds = [...new Set(leads.map(lead => lead.client_id).filter(Boolean))]
    setClientIdSuggestions(uniqueClientIds.sort())
    
    // Get client names from the clients list, not just from leads
    const uniqueClientNames = [...new Set(
      leads
        .map(lead => {
          const client = clientsList.find(c => c.client_id === lead.client_id)
          return client?.name
        })
        .filter(Boolean)
    )]
    // Also add all client names that exist in the clients list for better suggestions
    const allClientNames = clientsList.map(c => c.name).filter(Boolean)
    const combinedClientNames = [...new Set([...uniqueClientNames, ...allClientNames])]
    setClientNameSuggestions(combinedClientNames.sort())
    
    const uniqueDomains = [...new Set(
      leads
        .map(lead => lead.raw_payload?.domain)
        .filter(Boolean)
    )]
    setDomainSuggestions(uniqueDomains.sort())
    
    const uniqueSources = [...new Set(leads.map(lead => lead.source).filter(Boolean))]
    setSourceSuggestions(uniqueSources.sort())
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // At least one field must be filled
    if (!formData.client_id && !formData.client_name && !formData.domain) {
      setMessage({ type: "error", text: "Please fill at least one field (Client ID, Client Name, or Domain)" })
      return
    }

    // Save form data to sessionStorage
    sessionStorage.setItem('leadFormData', JSON.stringify(formData))

    // Filter leads based on form data
    let filtered = [...allLeads]

    if (formData.client_id) {
      filtered = filtered.filter((lead) => 
        lead.client_id?.toLowerCase().includes(formData.client_id.toLowerCase())
      )
    }

    if (formData.client_name) {
      filtered = filtered.filter((lead) => {
        const client = clients.find(c => c.client_id === lead.client_id)
        return client?.name?.toLowerCase().includes(formData.client_name.toLowerCase())
      })
    }

    if (formData.domain) {
      filtered = filtered.filter((lead) => {
        const domain = lead.raw_payload?.domain || ''
        return domain.toLowerCase().includes(formData.domain.toLowerCase())
      })
    }

    setFilteredLeads(filtered)
    setShowResults(true)
    setCurrentPage(1)
    setFilterSource("")
    setDateFrom(undefined)
    setDateTo(undefined)
    updateSuggestions(filtered, clients)
    
    // Update URL to indicate results view
    router.push('/leads?view=results', { scroll: false })
  }

  const applyResultsFilters = () => {
    let filtered = [...filteredLeads]

    if (filterSource) {
      filtered = filtered.filter((lead) => 
        lead.source?.toLowerCase().includes(filterSource.toLowerCase())
      )
    }

    if (dateFrom) {
      filtered = filtered.filter((lead) => {
        if (!lead.created_at) return false
        const leadDate = new Date(lead.created_at)
        return leadDate >= dateFrom
      })
    }

    if (dateTo) {
      filtered = filtered.filter((lead) => {
        if (!lead.created_at) return false
        const leadDate = new Date(lead.created_at)
        const endOfDay = new Date(dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        return leadDate <= endOfDay
      })
    }

    // Pagination
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    setDisplayedLeads(filtered.slice(startIndex, endIndex))
  }

  const getSourceBreakdown = () => {
    const breakdown: Record<string, number> = {}
    filteredLeads.forEach(lead => {
      const source = lead.source || 'Unknown'
      breakdown[source] = (breakdown[source] || 0) + 1
    })
    return breakdown
  }

  const getFilteredCount = () => {
    let filtered = [...filteredLeads]

    if (filterSource) {
      filtered = filtered.filter((lead) => 
        lead.source?.toLowerCase().includes(filterSource.toLowerCase())
      )
    }

    if (dateFrom) {
      filtered = filtered.filter((lead) => {
        if (!lead.created_at) return false
        return new Date(lead.created_at) >= dateFrom
      })
    }

    if (dateTo) {
      filtered = filtered.filter((lead) => {
        if (!lead.created_at) return false
        const endOfDay = new Date(dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        return new Date(lead.created_at) <= endOfDay
      })
    }

    return filtered.length
  }

  const totalPages = Math.ceil(getFilteredCount() / pageSize)

  const handleViewLead = (leadId: string) => {
    // Store current URL as return URL
    const currentUrl = showResults ? '/leads?view=results' : '/leads'
    sessionStorage.setItem('leadReturnUrl', currentUrl)
    router.push(`/leads/${leadId}`)
  }

  const handleReset = () => {
    setFormData({
      client_id: "",
      client_name: "",
      domain: ""
    })
    setShowResults(false)
    setFilteredLeads([])
    setDisplayedLeads([])
    setFilterSource("")
    setDateFrom(undefined)
    setDateTo(undefined)
    setCurrentPage(1)
    setMessage(null)
    // Clear saved form data
    sessionStorage.removeItem('leadFormData')
    // Update URL to remove view parameter
    router.push('/leads', { scroll: false })
  }

  // Filter ordpanel leads
  const ordPanelLeads = allLeads.filter(lead => lead.source === 'ordpanel' || lead.client_id === 'ORD_PANEL')
  const regularLeads = allLeads.filter(lead => lead.source !== 'ordpanel' && lead.client_id !== 'ORD_PANEL')

  const sourceBreakdown = getSourceBreakdown()
  const totalLeads = filteredLeads.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
              <p className="text-muted-foreground">
                Search and filter leads by client or domain
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={!showOrdPanelLeads ? "default" : "outline"}
            onClick={() => {
              setShowOrdPanelLeads(false)
              setShowResults(false)
            }}
            size="sm"
          >
            All Leads ({allLeads.length})
          </Button>
          <Button
            variant={showOrdPanelLeads ? "default" : "outline"}
            onClick={() => {
              setShowOrdPanelLeads(true)
              setShowResults(false)
            }}
            size="sm"
          >
            Order Panel ({ordPanelLeads.length})
          </Button>
          {showResults && (
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <X className="h-4 w-4" />
              New Search
            </Button>
          )}
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {showOrdPanelLeads ? (
        /* OrdPanel Leads View - Different UI */
        <Card>
          <CardHeader>
            <CardTitle>Order Panel Leads</CardTitle>
            <CardDescription>
              Leads submitted from the Order Panel portal (source: ordpanel). These leads are not associated with any client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : ordPanelLeads.length === 0 ? (
              <Alert>
                <AlertDescription>No leads from Order Panel yet.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordPanelLeads
                      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                      .map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name || '-'}</TableCell>
                          <TableCell>{lead.email || '-'}</TableCell>
                          <TableCell>{lead.phone || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {lead.raw_payload?.product_name || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {lead.raw_payload?.client_name || '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(lead.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/leads/${lead.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                {ordPanelLeads.length > pageSize && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, ordPanelLeads.length)} of {ordPanelLeads.length} leads
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage * pageSize >= ordPanelLeads.length}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : !showResults ? (
        /* Search Form */
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search Leads
            </CardTitle>
            <CardDescription>Enter client ID, client name, or domain to search for leads</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Client ID */}
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client ID</Label>
                  <div className="relative">
                    <Input
                      id="client_id"
                      placeholder="Enter client ID..."
                      value={formData.client_id}
                      onChange={(e) => {
                        setFormData({ ...formData, client_id: e.target.value })
                        setShowClientIdSuggestions(true)
                      }}
                      onFocus={() => setShowClientIdSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowClientIdSuggestions(false), 200)}
                      className="h-11"
                    />
                    {showClientIdSuggestions && formData.client_id && clientIdSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border rounded-md shadow-lg max-h-48 overflow-auto">
                        {clientIdSuggestions
                          .filter(id => id.toLowerCase().includes(formData.client_id.toLowerCase()))
                          .slice(0, 10)
                          .map((suggestion) => (
                            <div
                              key={suggestion}
                              className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                              onMouseDown={() => {
                                setFormData({ ...formData, client_id: suggestion })
                                setShowClientIdSuggestions(false)
                              }}
                            >
                              {suggestion}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Client Name */}
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name</Label>
                  <div className="relative">
                    <Input
                      id="client_name"
                      placeholder="Enter client name..."
                      value={formData.client_name}
                      onChange={(e) => {
                        setFormData({ ...formData, client_name: e.target.value })
                        setShowClientNameSuggestions(true)
                      }}
                      onFocus={() => setShowClientNameSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowClientNameSuggestions(false), 200)}
                      className="h-11"
                    />
                    {showClientNameSuggestions && formData.client_name && clientNameSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border rounded-md shadow-lg max-h-48 overflow-auto">
                        {clientNameSuggestions
                          .filter(name => name.toLowerCase().includes(formData.client_name.toLowerCase()))
                          .slice(0, 10)
                          .map((suggestion) => (
                            <div
                              key={suggestion}
                              className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                              onMouseDown={() => {
                                setFormData({ ...formData, client_name: suggestion })
                                setShowClientNameSuggestions(false)
                              }}
                            >
                              {suggestion}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Domain */}
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <div className="relative">
                    <Input
                      id="domain"
                      placeholder="Enter domain..."
                      value={formData.domain}
                      onChange={(e) => {
                        setFormData({ ...formData, domain: e.target.value })
                        setShowDomainSuggestions(true)
                      }}
                      onFocus={() => setShowDomainSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowDomainSuggestions(false), 200)}
                      className="h-11"
                    />
                    {showDomainSuggestions && formData.domain && domainSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border rounded-md shadow-lg max-h-48 overflow-auto">
                        {domainSuggestions
                          .filter(domain => domain.toLowerCase().includes(formData.domain.toLowerCase()))
                          .slice(0, 10)
                          .map((suggestion) => (
                            <div
                              key={suggestion}
                              className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                              onMouseDown={() => {
                                setFormData({ ...formData, domain: suggestion })
                                setShowDomainSuggestions(false)
                              }}
                            >
                              {suggestion}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Searching..." : "Search Leads"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({ client_id: "", client_name: "", domain: "" })
                  }}
                >
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Results View */
        <>
          {/* Source Breakdown */}
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Lead Analysis by Source
              </CardTitle>
              <CardDescription>
                Found {totalLeads} leads matching your search criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {totalLeads > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(sourceBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([source, count]) => (
                      <div
                        key={source}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          filterSource === source
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-accent'
                        }`}
                        onClick={() => {
                          setFilterSource(filterSource === source ? "" : source)
                          setCurrentPage(1)
                        }}
                      >
                        <div className="text-xs text-muted-foreground mb-1">Source</div>
                        <div className="font-semibold text-2xl">{count}</div>
                        <div className="text-sm mt-1">{source}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {((count / totalLeads) * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No leads found</p>
              )}
            </CardContent>
          </Card>

          {/* Filters and Results */}
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Filtered Leads
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Showing {displayedLeads.length} of {getFilteredCount()} leads (Page {currentPage} of {totalPages || 1})
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {totalLeads} total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Filters */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Source Filter */}
                <div className="space-y-2">
                  <Label className="text-xs">Filter by Source</Label>
                  <div className="relative">
                    <Input
                      placeholder="Filter by source..."
                      value={filterSource}
                      onChange={(e) => {
                        setFilterSource(e.target.value)
                        setShowSourceSuggestions(true)
                        setCurrentPage(1)
                      }}
                      onFocus={() => setShowSourceSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSourceSuggestions(false), 200)}
                      className="h-11"
                    />
                    {showSourceSuggestions && filterSource && sourceSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border rounded-md shadow-lg max-h-48 overflow-auto">
                        {sourceSuggestions
                          .filter(source => source.toLowerCase().includes(filterSource.toLowerCase()))
                          .slice(0, 10)
                          .map((suggestion) => (
                            <div
                              key={suggestion}
                              className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                              onMouseDown={() => {
                                setFilterSource(suggestion)
                                setShowSourceSuggestions(false)
                              }}
                            >
                              {suggestion}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Date From Filter */}
                <div className="space-y-2">
                  <Label className="text-xs">From Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      value={dateFrom ? dateFrom.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        setDateFrom(e.target.value ? new Date(e.target.value) : undefined)
                        setCurrentPage(1)
                      }}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                {/* Date To Filter */}
                <div className="space-y-2">
                  <Label className="text-xs">To Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      value={dateTo ? dateTo.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        setDateTo(e.target.value ? new Date(e.target.value) : undefined)
                        setCurrentPage(1)
                      }}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(filterSource || dateFrom || dateTo) && (
                <div className="mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterSource("")
                      setDateFrom(undefined)
                      setDateTo(undefined)
                      setCurrentPage(1)
                    }}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Loading State */}
              {loading && displayedLeads.length === 0 ? (
                <Loader text="Loading leads..." />
              ) : displayedLeads.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground font-medium">
                    No leads match your filters
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Lead ID</TableHead>
                          <TableHead className="font-semibold">Client ID</TableHead>
                          <TableHead className="font-semibold">Name</TableHead>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold">Phone</TableHead>
                          <TableHead className="font-semibold">Source</TableHead>
                          <TableHead className="font-semibold">Created</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedLeads.map((lead) => (
                          <TableRow key={lead.id || lead.lead_id} className="table-row-3d">
                            <TableCell>
                              <code className="text-xs font-mono">
                                {lead.id || lead.lead_id || "N/A"}
                              </code>
                            </TableCell>
                            <TableCell>
                              <code className="text-sm font-mono font-semibold">
                                {lead.client_id || "N/A"}
                              </code>
                            </TableCell>
                            <TableCell className="font-medium">{lead.name || "N/A"}</TableCell>
                            <TableCell>{lead.email || "N/A"}</TableCell>
                            <TableCell>{lead.phone || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {lead.source || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewLead(lead.id || lead.lead_id)}
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="gap-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="gap-2"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
