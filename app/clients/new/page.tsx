"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { clientApi } from "@/lib/api"
import { Building2, ArrowLeft, CheckCircle2, XCircle, RefreshCw, Save, Globe, Mail, Phone, MapPin, Calendar } from "lucide-react"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [generatingClientId, setGeneratingClientId] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [formData, setFormData] = useState({
    // Basic Info (Customer No = Client ID)
    customer_no: "",
    name: "",
    status: "active",
    is_premium: false,
    
    // Client Information
    company_name: "",
    contact_person: "",
    designation: "",
    address: "",
    phone: "",
    email: "",
    domain_name: "",
    gst_no: "",
    
    // Order Details
    order_date: "",
    total_package: "",
    
    // Services
    services: [] as string[],
    email_services: [] as string[],
    pop_id_count: "",
    g_suite_id_count: "",
    
    // Guidelines
    guidelines: "",
    
    // SEO Fields
    seo_keyword_range: [] as string[],
    seo_location: [] as string[],
    seo_keywords_list: "",
    
    // Google Adwords
    adwords_keywords: "",
    adwords_period: "",
    adwords_location: "",
    adwords_keywords_list: "",
    
    // Special Guidelines
    special_guidelines: "",
    
    // Description
    description: "",
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Auto-generate client ID on component mount
  useEffect(() => {
    const generateClientId = async () => {
      try {
        setGeneratingClientId(true)
        
        // Get today's date in YYYYMMDD format
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        const dateStr = `${year}${month}${day}`
        
        // Pattern to match: ORD-YYYYMMDD-XXX
        const todayPattern = `ORD-${dateStr}-`
        
        // Fetch all clients
        const response = await clientApi.list()
        
        if (response.error) {
          // If error fetching, start with 001
          const newClientId = `${todayPattern}001`
          setFormData(prev => ({ ...prev, customer_no: newClientId }))
          setGeneratingClientId(false)
          return
        }
        
        const clients = response.data || []
        
        // Filter clients with customer_no matching today's pattern
        const todayClients = clients.filter((client: any) => {
          const customerNo = client.customer_no || client.client_id || ""
          return customerNo.startsWith(todayPattern)
        })
        
        // Extract numbers from customer_no (ORD-YYYYMMDD-XXX)
        const numbers: number[] = []
        todayClients.forEach((client: any) => {
          const customerNo = client.customer_no || client.client_id || ""
          const match = customerNo.match(/ORD-\d{8}-(\d+)$/)
          if (match && match[1]) {
            const num = parseInt(match[1], 10)
            if (!isNaN(num)) {
              numbers.push(num)
            }
          }
        })
        
        // Get the highest number or start with 001
        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0
        const nextNumber = maxNumber + 1
        const nextNumberStr = String(nextNumber).padStart(3, '0')
        
        // Generate new client ID
        const newClientId = `${todayPattern}${nextNumberStr}`
        setFormData(prev => ({ ...prev, customer_no: newClientId }))
      } catch (error) {
        // On error, generate with today's date and 001
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        const dateStr = `${year}${month}${day}`
        const newClientId = `ORD-${dateStr}-001`
        setFormData(prev => ({ ...prev, customer_no: newClientId }))
      } finally {
        setGeneratingClientId(false)
      }
    }
    
    generateClientId()
  }, [])

  const handleServiceToggle = (serviceCode: string) => {
    setFormData(prev => {
      const services = prev.services.includes(serviceCode)
        ? prev.services.filter(s => s !== serviceCode)
        : [...prev.services, serviceCode]
      return { ...prev, services }
    })
  }

  const handleEmailServiceToggle = (serviceCode: string) => {
    setFormData(prev => {
      const email_services = prev.email_services.includes(serviceCode)
        ? prev.email_services.filter(s => s !== serviceCode)
        : [...prev.email_services, serviceCode]
      return { ...prev, email_services }
    })
  }

  const handleSEOKeywordRangeToggle = (value: string) => {
    setFormData(prev => {
      const ranges = prev.seo_keyword_range.includes(value)
        ? prev.seo_keyword_range.filter(r => r !== value)
        : [...prev.seo_keyword_range, value]
      return { ...prev, seo_keyword_range: ranges }
    })
  }

  const handleSEOLocationToggle = (value: string) => {
    setFormData(prev => {
      const locations = prev.seo_location.includes(value)
        ? prev.seo_location.filter(l => l !== value)
        : [...prev.seo_location, value]
      return { ...prev, seo_location: locations }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Customer No = Client ID (same thing) - use auto-generated value
    const client_id = formData.customer_no
    
    if (!client_id || client_id.trim() === "") {
      setMessage({ type: "error", text: "Client ID is required. Please wait for it to be generated." })
      setLoading(false)
      return
    }

    // Calculate GST and total amount
    const packageAmount = formData.total_package ? parseFloat(formData.total_package) : null
    const gstAmount = packageAmount ? packageAmount * 0.18 : null
    const totalAmount = packageAmount && gstAmount ? packageAmount + gstAmount : null

    // Parse order date (DD/MM/YYYY to YYYY-MM-DD)
    let orderDate = null
    if (formData.order_date) {
      const parts = formData.order_date.split("/")
      if (parts.length === 3) {
        orderDate = `${parts[2]}-${parts[1]}-${parts[0]}`
      }
    }

    // Client name and company name are the same - use company_name if provided, otherwise use name
    const clientCompanyName = formData.company_name || formData.name || undefined
    
    // Use order submission endpoint which handles services too
    const orderData = {
      company_name: clientCompanyName,  // Name = Company Name (same thing)
      full_name: formData.contact_person || undefined,
      designation: formData.designation || undefined,
      address: formData.address || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      domain_name: formData.domain_name || undefined,
      gst_no: formData.gst_no || undefined,
      form_no: client_id, // Customer No = Client ID
      form_date: formData.order_date || undefined,
      total_package: packageAmount || undefined,
      services: formData.services.length > 0 ? formData.services : undefined,
      email_services: formData.email_services.length > 0 ? formData.email_services : undefined,
      pop_id_count: formData.pop_id_count ? parseInt(formData.pop_id_count) : undefined,
      g_suite_id_count: formData.g_suite_id_count ? parseInt(formData.g_suite_id_count) : undefined,
      guidelines: formData.guidelines || undefined,
      seo_keyword_range: formData.seo_keyword_range.length > 0 ? formData.seo_keyword_range : undefined,
      seo_location: formData.seo_location.length > 0 ? formData.seo_location : undefined,
      seo_keywords_list: formData.seo_keywords_list || undefined,
      adwords_keywords: formData.adwords_keywords || undefined,
      adwords_period: formData.adwords_period || undefined,
      adwords_location: formData.adwords_location || undefined,
      adwords_keywords_list: formData.adwords_keywords_list || undefined,
      special_guidelines: formData.special_guidelines || undefined,
    }

    // Use submitOrder endpoint which creates client with all order data
    const response = await clientApi.submitOrder(orderData)
    
    if (response.error) {
      setMessage({ type: "error", text: response.error })
    } else {
      // Update client with is_premium if needed
      const createdClientId = response.data?.client_id || client_id
      if (formData.is_premium) {
        await clientApi.update(createdClientId, { is_premium: true })
      }
      
      setMessage({ type: "success", text: "Client created successfully!" })
      // Redirect to client detail page after 1 second
      setTimeout(() => {
        router.push(`/clients/${createdClientId}`)
      }, 1000)
    }
    setLoading(false)
  }

  // Calculate GST and total when package amount changes
  const packageAmount = formData.total_package ? parseFloat(formData.total_package) : 0
  const gstAmount = packageAmount * 0.18
  const totalAmount = packageAmount + gstAmount

  const serviceCategories = [
    {
      category: "Domain & Hosting",
      services: [
        { code: "domain-hosting", name: "Domain & Hosting" },
        { code: "pop-id", name: "POP ID", quantity: true, quantityKey: "pop_id_count" },
        { code: "g-suite-id", name: "G Suite ID", quantity: true, quantityKey: "g_suite_id_count" },
      ]
    },
    {
      category: "Web Design",
      services: [
        { code: "website-design-development", name: "Website Design / Development" },
        { code: "website-maintenance", name: "Website Maintenance" },
        { code: "app-development", name: "App Development" },
      ]
    },
    {
      category: "SEO",
      services: [
        { code: "seo", name: "Search Engine Optimization" },
        { code: "google-ads", name: "Google Ads / PPC" },
        { code: "google-my-business", name: "Google My Business (Local)" },
      ]
    },
    {
      category: "Additional Services",
      services: [
        { code: "ai-chatbot", name: "AI Chatbot" },
        { code: "youtube-promotion", name: "YouTube Promotion" },
        { code: "email-marketing", name: "Email Marketing" },
      ]
    },
  ]

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
      </Button>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Client</h1>
            <p className="text-muted-foreground">
              Add a new client with complete order information
            </p>
          </div>
        </div>
      </div>

      {/* Alert Message */}
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
            <CardDescription>Client identification and status</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="customer_no" className="text-sm font-semibold">
                  Customer No. / Client ID *
                </Label>
                <Input
                  id="customer_no"
                  placeholder={generatingClientId ? "Generating..." : "ORD-YYYYMMDD-001"}
                  value={formData.customer_no}
                  onChange={(e) => setFormData({ ...formData, customer_no: e.target.value.toUpperCase() })}
                  className="h-11 font-mono"
                  required
                  disabled={generatingClientId}
                />
                <p className="text-xs text-muted-foreground">
                  {generatingClientId ? "Auto-generating client ID..." : "Customer No and Client ID are the same. Auto-generated based on today's date."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">
                  Client Name / Company Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Acme Corporation"
                  value={formData.name}
                  onChange={(e) => {
                    // Name and Company Name are the same - sync both fields
                    setFormData({ ...formData, name: e.target.value, company_name: e.target.value })
                  }}
                  className="h-11"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Client name and company name are the same
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-semibold">
                  Status
                </Label>
                <Combobox
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "suspended", label: "Suspended" },
                  ]}
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  placeholder="Select status..."
                  searchPlaceholder="Search status..."
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_premium"
                    checked={formData.is_premium}
                    onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_premium" className="text-sm font-semibold cursor-pointer">
                    Premium Client
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Client Information
            </CardTitle>
            <CardDescription>Contact and company details</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {/* Company Name removed - same as Client Name */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="contact_person" className="text-sm font-semibold">
                  Contact Person
                </Label>
                <Input
                  id="contact_person"
                  placeholder="Full Name"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation" className="text-sm font-semibold">
                  Designation
                </Label>
                <Input
                  id="designation"
                  placeholder="Designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Textarea
                id="address"
                placeholder="Complete address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="domain_name" className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Domain Name
                </Label>
                <Input
                  id="domain_name"
                  placeholder="example.com"
                  value={formData.domain_name}
                  onChange={(e) => setFormData({ ...formData, domain_name: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gst_no" className="text-sm font-semibold">
                  GSTIN No.
                </Label>
                <Input
                  id="gst_no"
                  placeholder="GST Number"
                  value={formData.gst_no}
                  onChange={(e) => setFormData({ ...formData, gst_no: e.target.value.toUpperCase() })}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                Company Description
              </Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Enter company description..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo" className="text-sm font-semibold">
                Company Logo
              </Label>
              {logoPreview && (
                <div className="mb-2">
                  <img src={logoPreview} alt="Logo preview" className="h-20 w-20 object-contain border rounded" />
                </div>
              )}
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setLogoFile(file)
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setLogoPreview(reader.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Upload company logo (PNG, JPG, etc.)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Services Selection */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle>Select Services</CardTitle>
            <CardDescription>Choose the services for this client</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {serviceCategories.map((category) => (
                <div key={category.category} className="space-y-3">
                  <h4 className="font-semibold text-sm text-primary border-b pb-2">
                    {category.category}
                  </h4>
                  <div className="space-y-2">
                    {category.services.map((service) => (
                      <div key={service.code} className="space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              service.code === "pop-id" || service.code === "g-suite-id"
                                ? formData.email_services.includes(service.code)
                                : formData.services.includes(service.code)
                            }
                            onChange={() => {
                              if (service.code === "pop-id" || service.code === "g-suite-id") {
                                handleEmailServiceToggle(service.code)
                              } else {
                                handleServiceToggle(service.code)
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">{service.name}</span>
                        </label>
                        {service.quantity && (
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={
                              service.code === "pop-id"
                                ? formData.pop_id_count
                                : formData.g_suite_id_count
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [service.quantityKey!]: e.target.value,
                              })
                            }
                            disabled={
                              service.code === "pop-id"
                                ? !formData.email_services.includes("pop-id")
                                : !formData.email_services.includes("g-suite-id")
                            }
                            className="h-9 ml-6"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Special Guidelines */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle>Specific Guidelines</CardTitle>
            <CardDescription>Website & SEO specific guidelines</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="guidelines" className="text-sm font-semibold">
                Guidelines (Website & SEO)
              </Label>
              <Textarea
                id="guidelines"
                placeholder="Enter specific guidelines for website and SEO..."
                value={formData.guidelines}
                onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })}
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO Instructions */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle>Search Engine Optimization (SEO)</CardTitle>
            <CardDescription>SEO configuration and keywords</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Keyword Range</Label>
              <div className="flex flex-wrap gap-4">
                {["upto-25", "25-50", "75-100"].map((range) => (
                  <label key={range} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.seo_keyword_range.includes(range)}
                      onChange={() => handleSEOKeywordRangeToggle(range)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">
                      {range === "upto-25" ? "Upto 25" : range === "25-50" ? "25 – 50" : "75 – 100"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Location</Label>
              <div className="flex flex-wrap gap-4">
                {[
                  { value: "state-wise", label: "State" },
                  { value: "india", label: "India" },
                  { value: "country-wise", label: "Country" },
                  { value: "global", label: "Global" },
                ].map((location) => (
                  <label key={location.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.seo_location.includes(location.value)}
                      onChange={() => handleSEOLocationToggle(location.value)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">{location.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_keywords_list" className="text-sm font-semibold">
                Top Products / Keywords
              </Label>
              <Textarea
                id="seo_keywords_list"
                placeholder="1.&#10;2.&#10;3.&#10;4.&#10;5.&#10;..."
                value={formData.seo_keywords_list}
                onChange={(e) => setFormData({ ...formData, seo_keywords_list: e.target.value })}
                rows={8}
              />
            </div>
          </CardContent>
        </Card>

        {/* Google Adwords */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle>Google Adwords</CardTitle>
            <CardDescription>Google Ads configuration</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="adwords_keywords" className="text-sm font-semibold">
                  Number of Keywords
                </Label>
                <Input
                  id="adwords_keywords"
                  placeholder="Number of keywords"
                  value={formData.adwords_keywords}
                  onChange={(e) => setFormData({ ...formData, adwords_keywords: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adwords_period" className="text-sm font-semibold">
                  Period
                </Label>
                <Input
                  id="adwords_period"
                  placeholder="Monthly / Quarterly"
                  value={formData.adwords_period}
                  onChange={(e) => setFormData({ ...formData, adwords_period: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adwords_location" className="text-sm font-semibold">
                Location
              </Label>
              <Input
                id="adwords_location"
                placeholder="Target location"
                value={formData.adwords_location}
                onChange={(e) => setFormData({ ...formData, adwords_location: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adwords_keywords_list" className="text-sm font-semibold">
                Keywords
              </Label>
              <Textarea
                id="adwords_keywords_list"
                placeholder="List of keywords for Google Ads"
                value={formData.adwords_keywords_list}
                onChange={(e) => setFormData({ ...formData, adwords_keywords_list: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Special Guidelines */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle>Special Guidelines</CardTitle>
            <CardDescription>Additional special instructions</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="special_guidelines" className="text-sm font-semibold">
                Special Guidelines
              </Label>
              <Textarea
                id="special_guidelines"
                placeholder="Enter special guidelines and instructions..."
                value={formData.special_guidelines}
                onChange={(e) => setFormData({ ...formData, special_guidelines: e.target.value })}
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order & Payment Details */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Order & Payment Details
            </CardTitle>
            <CardDescription>Order form information and payment breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="order_date" className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Order Date
                </Label>
                <Input
                  id="order_date"
                  placeholder="DD/MM/YYYY"
                  value={formData.order_date}
                  onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Format: DD/MM/YYYY (e.g., 15/01/2024)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_package" className="text-sm font-semibold">
                  Package Amount (₹) *
                </Label>
                <Input
                  id="total_package"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.total_package}
                  onChange={(e) => setFormData({ ...formData, total_package: e.target.value })}
                  className="h-11"
                  required
                />
              </div>
            </div>

            {/* GST and Total Calculation Display */}
            {packageAmount > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg border">
                <div>
                  <Label className="text-xs text-muted-foreground">Package Amount</Label>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    ₹{packageAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">GST (18%)</Label>
                  <p className="text-lg font-bold text-blue-600 mt-1">
                    ₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Amount</Label>
                  <p className="text-2xl font-bold text-primary mt-1">
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center gap-3 pt-6">
          <Button type="submit" disabled={loading} className="gap-2" size="lg">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Client
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
