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
import { leadApi, clientApi } from "@/lib/api"
import { Search, ArrowLeft, Calendar, X, Filter } from "lucide-react"

export default function LeadAnalysisPage() {
  const router = useRouter()
  const [allLeads, setAllLeads] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  const [filterClientId, setFilterClientId] = useState("")
  const [filterClientName, setFilterClientName] = useState("")
  const [filterDomain, setFilterDomain] = useState("")
  const [filterSource, setFilterSource] = useState("")
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  
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
  }, [])

  useEffect(() => {
    applyFilters()
    updateSuggestions()
  }, [filterClientId, filterClientName, filterDomain, filterSource, dateFrom, dateTo, searchQuery, allLeads, currentPage, clients])

  const fetchLeads = async () => {
    setLoading(true)
    const response = await leadApi.list()
    if (response.data) {
      const leadsData = Array.isArray(response.data) ? response.data : []
      setAllLeads(leadsData)
      applyFilters(leadsData)
    } else {
      setMessage({ type: "error", text: response.error || "Failed to fetch leads" })
    }
    setLoading(false)
  }

  const fetchClients = async () => {
    const response = await clientApi.list()
    if (response.data) {
      setClients(Array.isArray(response.data) ? response.data : [])
    }
  }

  // Update autocomplete suggestions based on all leads
  const updateSuggestions = () => {
    if (allLeads.length === 0) return
    
    const uniqueClientIds = [...new Set(allLeads.map(lead => lead.client_id).filter(Boolean))]
    setClientIdSuggestions(uniqueClientIds.sort())
    
    const uniqueClientNames = [...new Set(
      allLeads
        .map(lead => {
          const client = clients.find(c => c.client_id === lead.client_id)
          return client?.name
        })
        .filter(Boolean)
    )]
    setClientNameSuggestions(uniqueClientNames.sort())
    
    const uniqueDomains = [...new Set(
      allLeads
        .map(lead => lead.raw_payload?.domain)
        .filter(Boolean)
    )]
    setDomainSuggestions(uniqueDomains.sort())
    
    const uniqueSources = [...new Set(allLeads.map(lead => lead.source).filter(Boolean))]
    setSourceSuggestions(uniqueSources.sort())
  }

  const applyFilters = (leadsToFilter = allLeads) => {
    let filtered = [...leadsToFilter]

    if (filterClientId) {
      filtered = filtered.filter((lead) => 
        lead.client_id?.toLowerCase().includes(filterClientId.toLowerCase())
      )
    }

    if (filterClientName) {
      filtered = filtered.filter((lead) => {
        const client = clients.find(c => c.client_id === lead.client_id)
        return client?.name?.toLowerCase().includes(filterClientName.toLowerCase())
      })
    }

    if (filterDomain) {
      filtered = filtered.filter((lead) => {
        const domain = lead.raw_payload?.domain || ''
        return domain.toLowerCase().includes(filterDomain.toLowerCase())
      })
    }

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

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((lead) => {
        const client = clients.find(c => c.client_id === lead.client_id)
        return (
          lead.client_id?.toLowerCase().includes(query) ||
          client?.name?.toLowerCase().includes(query) ||
          lead.name?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query)
        )
      })
    }

    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    setLeads(filtered.slice(startIndex, endIndex))
  }

  const getFilteredCount = () => {
    let filtered = [...allLeads]
    
    if (filterClientId) {
      filtered = filtered.filter((lead) => 
        lead.client_id?.toLowerCase().includes(filterClientId.toLowerCase())
      )
    }
    if (filterClientName) {
      filtered = filtered.filter((lead) => {
        const client = clients.find(c => c.client_id === lead.client_id)
        return client?.name?.toLowerCase().includes(filterClientName.toLowerCase())
      })
    }
    if (filterDomain) {
      filtered = filtered.filter((lead) => {
        const domain = lead.raw_payload?.domain || ''
        return domain.toLowerCase().includes(filterDomain.toLowerCase())
      })
    }
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
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((lead) => {
        const client = clients.find(c => c.client_id === lead.client_id)
        return (
          lead.client_id?.toLowerCase().includes(query) ||
          client?.name?.toLowerCase().includes(query) ||
          lead.name?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query)
        )
      })
    }
    return filtered.length
  }

  const totalPages = Math.ceil(getFilteredCount() / pageSize)

  const clearFilters = () => {
    setFilterClientId("")
    setFilterClientName("")
    setFilterDomain("")
    setFilterSource("")
    setDateFrom(undefined)
    setDateTo(undefined)
    setSearchQuery("")
    setCurrentPage(1)
  }

  const hasActiveFilters = filterClientId || filterClientName || filterDomain || filterSource || dateFrom || dateTo || searchQuery

  const handleViewLead = (leadId: string) => {
    router.push(`/leads/${leadId}`)
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
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Lead Analysis</h1>
              <p className="text-muted-foreground">
                Filter and analyze leads by client, source, domain, and date range
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Client Analysis Form */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Client Analysis
          </CardTitle>
          <CardDescription>Enter client name or client ID to see lead analysis by source</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setCurrentPage(1)
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="analysis_client_id">Client ID</Label>
                <div className="relative">
                  <Input
                    id="analysis_client_id"
                    placeholder="Enter client ID..."
                    value={filterClientId}
                    onChange={(e) => {
                      setFilterClientId(e.target.value)
                      setShowClientIdSuggestions(true)
                      setCurrentPage(1)
                    }}
                    onFocus={() => setShowClientIdSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowClientIdSuggestions(false), 200)}
                    className="h-11"
                  />
                  {showClientIdSuggestions && filterClientId && clientIdSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border rounded-md shadow-lg max-h-48 overflow-auto">
                      {clientIdSuggestions
                        .filter(id => id.toLowerCase().includes(filterClientId.toLowerCase()))
                        .slice(0, 10)
                        .map((suggestion) => (
                          <div
                            key={suggestion}
                            className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                            onMouseDown={() => {
                              setFilterClientId(suggestion)
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
              <div className="space-y-2">
                <Label htmlFor="analysis_client_name">Client Name</Label>
                <div className="relative">
                  <Input
                    id="analysis_client_name"
                    placeholder="Enter client name..."
                    value={filterClientName}
                    onChange={(e) => {
                      setFilterClientName(e.target.value)
                      setShowClientNameSuggestions(true)
                      setCurrentPage(1)
                    }}
                    onFocus={() => setShowClientNameSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowClientNameSuggestions(false), 200)}
                    className="h-11"
                  />
                  {showClientNameSuggestions && filterClientName && clientNameSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border rounded-md shadow-lg max-h-48 overflow-auto">
                      {clientNameSuggestions
                        .filter(name => name.toLowerCase().includes(filterClientName.toLowerCase()))
                        .slice(0, 10)
                        .map((suggestion) => (
                          <div
                            key={suggestion}
                            className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                            onMouseDown={() => {
                              setFilterClientName(suggestion)
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
            </div>
          </form>

          {/* Source Analysis */}
          {(filterClientId || filterClientName) && (() => {
            let analysisLeads = [...allLeads]
            
            if (filterClientId) {
              analysisLeads = analysisLeads.filter((lead) => 
                lead.client_id?.toLowerCase().includes(filterClientId.toLowerCase())
              )
            }
            
            if (filterClientName) {
              analysisLeads = analysisLeads.filter((lead) => {
                const client = clients.find(c => c.client_id === lead.client_id)
                return client?.name?.toLowerCase().includes(filterClientName.toLowerCase())
              })
            }

            const sourceBreakdown: Record<string, number> = {}
            analysisLeads.forEach(lead => {
              const source = lead.source || 'Unknown'
              sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1
            })

            const totalLeads = analysisLeads.length

            if (totalLeads > 0) {
              return (
                <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                  <h3 className="text-sm font-semibold mb-4">Lead Analysis by Source</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(sourceBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([source, count]) => (
                        <div
                          key={source}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            filterSource === source
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-accent'
                          }`}
                          onClick={() => {
                            setFilterSource(source)
                            setCurrentPage(1)
                          }}
                        >
                          <div className="text-xs text-muted-foreground mb-1">Source</div>
                          <div className="font-semibold text-lg">{count}</div>
                          <div className="text-xs mt-1">{source}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {((count / totalLeads) * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Total: {totalLeads} leads
                  </div>
                </div>
              )
            }
            return null
          })()}
        </CardContent>
      </Card>

      {/* Leads List */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Filtered Leads
              </CardTitle>
              <CardDescription className="mt-1">
                Showing {leads.length} of {getFilteredCount()} leads (Page {currentPage} of {totalPages || 1})
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {allLeads.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client ID, client name, lead name, or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 h-11 input-3d"
              />
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Advanced Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                {/* Domain Filter */}
                <div className="space-y-2">
                  <Label className="text-xs">Domain</Label>
                  <div className="relative">
                    <Input
                      placeholder="Filter by domain..."
                      value={filterDomain}
                      onChange={(e) => {
                        setFilterDomain(e.target.value)
                        setShowDomainSuggestions(true)
                        setCurrentPage(1)
                      }}
                      onFocus={() => setShowDomainSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowDomainSuggestions(false), 200)}
                      className="h-9"
                    />
                    {showDomainSuggestions && filterDomain && domainSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border rounded-md shadow-lg max-h-48 overflow-auto">
                        {domainSuggestions
                          .filter(domain => domain.toLowerCase().includes(filterDomain.toLowerCase()))
                          .slice(0, 10)
                          .map((suggestion) => (
                            <div
                              key={suggestion}
                              className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                              onMouseDown={() => {
                                setFilterDomain(suggestion)
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

                {/* Source Filter */}
                <div className="space-y-2">
                  <Label className="text-xs">Source</Label>
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
                      className="h-9"
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
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && allLeads.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-40" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-48" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-32" />
                </div>
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">
                {hasActiveFilters ? "No leads match your filters" : "No leads found"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters ? "Try different filters" : "Start by entering a client ID or name"}
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
                    {leads.map((lead) => (
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
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

