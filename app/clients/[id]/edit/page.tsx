"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { clientApi } from "@/lib/api"
import { Building2, ArrowLeft, CheckCircle2, XCircle, RefreshCw, Save, Globe, Mail, Phone, MapPin } from "lucide-react"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    status: "active",
    is_premium: false,
    company_name: "",
    contact_person: "",
    designation: "",
    address: "",
    phone: "",
    email: "",
    domain_name: "",
    gst_no: "",
    package_amount: "",
    description: "",
    city: "",
    state: "",
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId])

  const fetchClient = async () => {
    setFetching(true)
    interface ClientResponse {
      client_id: string
      name: string
      status: string
      is_premium: boolean
      company_name?: string
      contact_person?: string
      designation?: string
      address?: string
      phone?: string
      email?: string
      domain_name?: string
      gst_no?: string
      package_amount?: number | string
      description?: string
      logo?: string
      city?: string
      state?: string
      customer_no?: string
      order_date?: string
      order_data?: any
    }
    const response = await clientApi.get(clientId)
    if (response.data) {
      const client = response.data as ClientResponse
      setFormData({
        name: client.name || "",
        status: client.status || "active",
        is_premium: client.is_premium || false,
        company_name: client.company_name || "",
        contact_person: client.contact_person || "",
        designation: client.designation || "",
        address: client.address || "",
        phone: client.phone || "",
        email: client.email || "",
        domain_name: client.domain_name || "",
        gst_no: client.gst_no || "",
        package_amount: client.package_amount ? client.package_amount.toString() : "",
        description: client.description || "",
        city: client.city || "",
        state: client.state || "",
      })
      if (client.logo) {
        // Convert logo path to full URL if it's a relative path
        if (client.logo.startsWith('/static/images')) {
          const apiBaseUrl = typeof window !== 'undefined' 
            ? (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                ? `http://${window.location.hostname}:8000`
                : 'http://localhost:8000')
            : 'http://localhost:8000'
          setLogoPreview(`${apiBaseUrl}${client.logo}`)
        } else {
          setLogoPreview(client.logo)
        }
      }
    } else {
      setMessage({ type: "error", text: response.error || "Failed to fetch client" })
    }
    setFetching(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const updateData: any = {}
    
    if (formData.name) updateData.name = formData.name
    if (formData.status) updateData.status = formData.status
    updateData.is_premium = formData.is_premium
    if (formData.company_name) updateData.company_name = formData.company_name
    if (formData.contact_person) updateData.contact_person = formData.contact_person
    if (formData.designation) updateData.designation = formData.designation
    if (formData.address) updateData.address = formData.address
    if (formData.phone) updateData.phone = formData.phone
    if (formData.email) updateData.email = formData.email
    if (formData.domain_name) updateData.domain_name = formData.domain_name
    if (formData.gst_no) updateData.gst_no = formData.gst_no
    if (formData.package_amount) {
      const packageAmount = parseFloat(formData.package_amount)
      if (!isNaN(packageAmount)) {
        updateData.package_amount = packageAmount
        // Auto-calculate GST and total
        updateData.gst_amount = packageAmount * 0.18
        updateData.total_amount = packageAmount * 1.18
      }
    }
    // Use FormData if logo is being uploaded, otherwise use regular JSON
    if (logoFile) {
      const uploadFormData = new FormData()
      if (formData.name) uploadFormData.append("name", formData.name)
      if (formData.status) uploadFormData.append("status", formData.status)
      uploadFormData.append("is_premium", formData.is_premium.toString())
      if (formData.company_name) uploadFormData.append("company_name", formData.company_name)
      if (formData.contact_person) uploadFormData.append("contact_person", formData.contact_person)
      if (formData.designation) uploadFormData.append("designation", formData.designation)
      if (formData.address) uploadFormData.append("address", formData.address)
      if (formData.phone) uploadFormData.append("phone", formData.phone)
      if (formData.email) uploadFormData.append("email", formData.email)
      if (formData.domain_name) uploadFormData.append("domain_name", formData.domain_name)
      if (formData.gst_no) uploadFormData.append("gst_no", formData.gst_no)
      if (formData.city) uploadFormData.append("city", formData.city)
      if (formData.state) uploadFormData.append("state", formData.state)
      // Always include description, even if empty string, so it can be cleared
      if (formData.description !== undefined) uploadFormData.append("description", formData.description)
      if (formData.package_amount) {
        const packageAmount = parseFloat(formData.package_amount)
        if (!isNaN(packageAmount)) {
          uploadFormData.append("package_amount", packageAmount.toString())
        }
      }
      uploadFormData.append("logo", logoFile)
      
      const response = await clientApi.updateWithFormData(clientId, uploadFormData)
      
      if (response.error) {
        setMessage({ type: "error", text: response.error })
      } else {
        setMessage({ type: "success", text: "Client updated successfully!" })
        setTimeout(() => {
          router.push(`/clients/${clientId}`)
        }, 1000)
      }
      setLoading(false)
      return
    }

    // Regular JSON update if no logo file
    // Always include description, even if empty string, so it can be cleared
    if (formData.description !== undefined) updateData.description = formData.description

    const response = await clientApi.update(clientId, updateData)
    
    if (response.error) {
      setMessage({ type: "error", text: response.error })
    } else {
      setMessage({ type: "success", text: "Client updated successfully!" })
      // Redirect to client detail page after 1 second
      setTimeout(() => {
        router.push(`/clients/${clientId}`)
      }, 1000)
    }
    setLoading(false)
  }

  if (fetching) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading client data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
            <p className="text-muted-foreground">
              Update client information
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
                <Label htmlFor="client_id" className="text-sm font-semibold">
                  Client ID
                </Label>
                <Input
                  id="client_id"
                  value={clientId}
                  className="h-11 font-mono bg-muted"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Client ID cannot be changed
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
                    setFormData({ ...formData, name: e.target.value, company_name: e.target.value })
                  }}
                  className="h-11"
                  required
                />
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
            </div>

            <div className="flex items-center space-x-2 pt-2">
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

        {/* Package Amount */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle>Package Amount</CardTitle>
            <CardDescription>Update package amount (GST will be auto-calculated)</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="package_amount" className="text-sm font-semibold">
                Package Amount (₹)
              </Label>
              <Input
                id="package_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.package_amount}
                onChange={(e) => setFormData({ ...formData, package_amount: e.target.value })}
                className="h-11"
              />
              {formData.package_amount && parseFloat(formData.package_amount) > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg border mt-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Package Amount</Label>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      ₹{parseFloat(formData.package_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">GST (18%)</Label>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      ₹{(parseFloat(formData.package_amount) * 0.18).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Amount</Label>
                    <p className="text-2xl font-bold text-primary mt-1">
                      ₹{(parseFloat(formData.package_amount) * 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center gap-3 pt-6">
          <Button type="submit" disabled={loading} className="gap-2" size="lg">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Update Client
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

