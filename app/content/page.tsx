"use client"

import { useState, useEffect } from "react"
import { contentApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState("about-us")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  // About Us state
  const [aboutUs, setAboutUs] = useState<any>(null)
  const [aboutUsForm, setAboutUsForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    status: "active"
  })

  // Contact Details state
  const [contactDetails, setContactDetails] = useState<any>(null)
  const [contactForm, setContactForm] = useState({
    company_name: "",
    email: [""],
    phone: [""],
    address: "",
    website: [""],
    social_media: {
      facebook: "",
      linkedin: "",
      instagram: "",
      youtube: "",
      twitter: ""
    },
    status: "active"
  })

  useEffect(() => {
    loadAboutUs()
    loadContactDetails()
  }, [])

  const loadAboutUs = async () => {
    try {
      interface AboutUsResponse {
        id: string
        title: string
        subtitle?: string
        description?: string
        status: string
        created_at: string
        updated_at: string
      }
      const response = await contentApi.getAboutUs()
      if (response.data) {
        const data = response.data as AboutUsResponse
        setAboutUs(data)
        setAboutUsForm({
          title: data.title || "",
          subtitle: data.subtitle || "",
          description: data.description || "",
          status: data.status || "active"
        })
      }
    } catch (error: any) {
      // If 404, it means no content exists yet - that's okay
      if (error.error?.includes("404") || error.detail?.includes("not found")) {
        setAboutUs(null)
      } else {
        setMessage({ type: "error", text: "Failed to load About Us content" })
      }
    }
  }

  const loadContactDetails = async () => {
    try {
      interface ContactDetailsResponse {
        id: string
        company_name?: string
        email?: string[]
        phone?: string[]
        address?: string
        website?: string[]
        social_media?: {
          facebook?: string
          linkedin?: string
          instagram?: string
          youtube?: string
          twitter?: string
          [key: string]: string | undefined
        }
        status: string
        created_at: string
        updated_at: string
      }
      const response = await contentApi.getContactDetails()
      if (response.data) {
        const data = response.data as ContactDetailsResponse
        setContactDetails(data)
        setContactForm({
          company_name: data.company_name || "",
          email: data.email || [""],
          phone: data.phone || [""],
          address: data.address || "",
          website: data.website || [""],
          social_media: {
            facebook: data.social_media?.facebook || "",
            linkedin: data.social_media?.linkedin || "",
            instagram: data.social_media?.instagram || "",
            youtube: data.social_media?.youtube || "",
            twitter: data.social_media?.twitter || ""
          },
          status: data.status || "active"
        })
      }
    } catch (error: any) {
      // If 404, it means no content exists yet - that's okay
      if (error.error?.includes("404") || error.detail?.includes("not found")) {
        setContactDetails(null)
      } else {
        setMessage({ type: "error", text: "Failed to load Contact Details" })
      }
    }
  }

  const handleSaveAboutUs = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      let response
      if (aboutUs) {
        // Update existing
        response = await contentApi.updateAboutUs(aboutUs.id, aboutUsForm)
      } else {
        // Create new
        response = await contentApi.createAboutUs(aboutUsForm)
      }
      
      if (response.data) {
        setMessage({ type: "success", text: "About Us content saved successfully" })
        loadAboutUs()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || error.detail || "Failed to save About Us content" })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveContactDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      // Filter out empty strings from arrays
      const email = contactForm.email.filter(e => e.trim() !== "")
      const phone = contactForm.phone.filter(p => p.trim() !== "")
      const website = contactForm.website.filter(w => w.trim() !== "")
      
      // Filter out empty social media links
      const social_media: Record<string, string> = {}
      Object.entries(contactForm.social_media).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          social_media[key] = value
        }
      })

      const data = {
        ...contactForm,
        email: email.length > 0 ? email : undefined,
        phone: phone.length > 0 ? phone : undefined,
        website: website.length > 0 ? website : undefined,
        social_media: Object.keys(social_media).length > 0 ? social_media : undefined
      }

      let response
      if (contactDetails) {
        // Update existing
        response = await contentApi.updateContactDetails(contactDetails.id, data)
      } else {
        // Create new
        response = await contentApi.createContactDetails(data)
      }
      
      if (response.data) {
        setMessage({ type: "success", text: "Contact Details saved successfully" })
        loadContactDetails()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || error.detail || "Failed to save Contact Details" })
    } finally {
      setLoading(false)
    }
  }

  const addEmailField = () => {
    setContactForm({
      ...contactForm,
      email: [...contactForm.email, ""]
    })
  }

  const removeEmailField = (index: number) => {
    setContactForm({
      ...contactForm,
      email: contactForm.email.filter((_, i) => i !== index)
    })
  }

  const updateEmail = (index: number, value: string) => {
    const newEmail = [...contactForm.email]
    newEmail[index] = value
    setContactForm({ ...contactForm, email: newEmail })
  }

  const addPhoneField = () => {
    setContactForm({
      ...contactForm,
      phone: [...contactForm.phone, ""]
    })
  }

  const removePhoneField = (index: number) => {
    setContactForm({
      ...contactForm,
      phone: contactForm.phone.filter((_, i) => i !== index)
    })
  }

  const updatePhone = (index: number, value: string) => {
    const newPhone = [...contactForm.phone]
    newPhone[index] = value
    setContactForm({ ...contactForm, phone: newPhone })
  }

  const addWebsiteField = () => {
    setContactForm({
      ...contactForm,
      website: [...contactForm.website, ""]
    })
  }

  const removeWebsiteField = (index: number) => {
    setContactForm({
      ...contactForm,
      website: contactForm.website.filter((_, i) => i !== index)
    })
  }

  const updateWebsite = (index: number, value: string) => {
    const newWebsite = [...contactForm.website]
    newWebsite[index] = value
    setContactForm({ ...contactForm, website: newWebsite })
  }

  const updateSocialMedia = (platform: string, value: string) => {
    setContactForm({
      ...contactForm,
      social_media: {
        ...contactForm.social_media,
        [platform]: value
      }
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage About Us and Contact Details for the order panel
          </p>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="about-us">About Us</TabsTrigger>
          <TabsTrigger value="contact-details">Contact Details</TabsTrigger>
        </TabsList>

        <TabsContent value="about-us" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About Us Content</CardTitle>
              <CardDescription>
                Manage the About Us section content displayed on the order panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAboutUs} className="space-y-4">
                <div>
                  <Label htmlFor="about-title">Title</Label>
                  <Input
                    id="about-title"
                    value={aboutUsForm.title}
                    onChange={(e) => setAboutUsForm({ ...aboutUsForm, title: e.target.value })}
                    placeholder="Enter title"
                  />
                </div>
                <div>
                  <Label htmlFor="about-subtitle">Subtitle</Label>
                  <Input
                    id="about-subtitle"
                    value={aboutUsForm.subtitle}
                    onChange={(e) => setAboutUsForm({ ...aboutUsForm, subtitle: e.target.value })}
                    placeholder="Enter subtitle"
                  />
                </div>
                <div>
                  <Label htmlFor="about-description">Description</Label>
                  <Textarea
                    id="about-description"
                    value={aboutUsForm.description}
                    onChange={(e) => setAboutUsForm({ ...aboutUsForm, description: e.target.value })}
                    placeholder="Enter description"
                    rows={6}
                  />
                </div>
                <div>
                  <Label htmlFor="about-status">Status</Label>
                  <Select
                    value={aboutUsForm.status}
                    onValueChange={(value) => setAboutUsForm({ ...aboutUsForm, status: value })}
                  >
                    <SelectTrigger id="about-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={loading}>
                  {aboutUs ? "Update" : "Create"} About Us
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact-details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
              <CardDescription>
                Manage contact information displayed on the order panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveContactDetails} className="space-y-4">
                <div>
                  <Label htmlFor="contact-company">Company Name</Label>
                  <Input
                    id="contact-company"
                    value={contactForm.company_name}
                    onChange={(e) => setContactForm({ ...contactForm, company_name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Email Addresses</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addEmailField}>
                      Add Email
                    </Button>
                  </div>
                  {contactForm.email.map((email, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        placeholder="email@example.com"
                      />
                      {contactForm.email.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeEmailField(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Phone Numbers</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPhoneField}>
                      Add Phone
                    </Button>
                  </div>
                  {contactForm.phone.map((phone, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => updatePhone(index, e.target.value)}
                        placeholder="+1 234 567 8900"
                      />
                      {contactForm.phone.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removePhoneField(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <Label htmlFor="contact-address">Address</Label>
                  <Textarea
                    id="contact-address"
                    value={contactForm.address}
                    onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Websites</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addWebsiteField}>
                      Add Website
                    </Button>
                  </div>
                  {contactForm.website.map((website, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        type="url"
                        value={website}
                        onChange={(e) => updateWebsite(index, e.target.value)}
                        placeholder="https://example.com"
                      />
                      {contactForm.website.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeWebsiteField(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <Label className="mb-2 block">Social Media Links</Label>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="social-facebook" className="text-sm">Facebook</Label>
                      <Input
                        id="social-facebook"
                        type="url"
                        value={contactForm.social_media.facebook}
                        onChange={(e) => updateSocialMedia("facebook", e.target.value)}
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                    <div>
                      <Label htmlFor="social-linkedin" className="text-sm">LinkedIn</Label>
                      <Input
                        id="social-linkedin"
                        type="url"
                        value={contactForm.social_media.linkedin}
                        onChange={(e) => updateSocialMedia("linkedin", e.target.value)}
                        placeholder="https://linkedin.com/company/yourcompany"
                      />
                    </div>
                    <div>
                      <Label htmlFor="social-instagram" className="text-sm">Instagram</Label>
                      <Input
                        id="social-instagram"
                        type="url"
                        value={contactForm.social_media.instagram}
                        onChange={(e) => updateSocialMedia("instagram", e.target.value)}
                        placeholder="https://instagram.com/yourhandle"
                      />
                    </div>
                    <div>
                      <Label htmlFor="social-youtube" className="text-sm">YouTube</Label>
                      <Input
                        id="social-youtube"
                        type="url"
                        value={contactForm.social_media.youtube}
                        onChange={(e) => updateSocialMedia("youtube", e.target.value)}
                        placeholder="https://youtube.com/@yourchannel"
                      />
                    </div>
                    <div>
                      <Label htmlFor="social-twitter" className="text-sm">Twitter/X</Label>
                      <Input
                        id="social-twitter"
                        type="url"
                        value={contactForm.social_media.twitter}
                        onChange={(e) => updateSocialMedia("twitter", e.target.value)}
                        placeholder="https://twitter.com/yourhandle"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="contact-status">Status</Label>
                  <Select
                    value={contactForm.status}
                    onValueChange={(value) => setContactForm({ ...contactForm, status: value })}
                  >
                    <SelectTrigger id="contact-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={loading}>
                  {contactDetails ? "Update" : "Create"} Contact Details
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

