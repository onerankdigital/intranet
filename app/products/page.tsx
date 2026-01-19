"use client"

import { useState, useEffect } from "react"
import { productApi, clientApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

// Helper function to get API base URL
function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  const hostname = window.location.hostname
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    return `http://${hostname}:8000`
  }
  return "http://localhost:8000"
}

// Helper function to construct image URL
function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return ""
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath
  }
  const apiBaseUrl = getApiBaseUrl()
  if (imagePath.startsWith("/static/images")) {
    return `${apiBaseUrl}${imagePath}`
  }
  return `${apiBaseUrl}/static/images${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
}

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState("industries")
  const [industries, setIndustries] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [clientProducts, setClientProducts] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  // Form states
  const [industryForm, setIndustryForm] = useState({ name: "", description: "", is_home: false, is_top: false })
  const [industryImage, setIndustryImage] = useState<File | null>(null)
  const [industryLogo, setIndustryLogo] = useState<File | null>(null)
  const [categoryForm, setCategoryForm] = useState({ industry_id: "", name: "", description: "" })
  const [categoryImage, setCategoryImage] = useState<File | null>(null)
  const [productForm, setProductForm] = useState({ category_id: "", name: "", description: "" })
  const [productImages, setProductImagesFiles] = useState<File[]>([])
  const [existingProductImages, setExistingProductImages] = useState<any[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [attachForm, setAttachForm] = useState({ client_id: "", product_id: "" })

  useEffect(() => {
    loadIndustries()
    loadCategories()
    loadProducts()
    loadClients()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadClientProducts()
    }
  }, [selectedClient])

  const loadIndustries = async () => {
    try {
      const response = await productApi.listIndustries()
      if (response.data && Array.isArray(response.data)) {
        setIndustries(response.data)
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load industries" })
    }
  }

  const loadCategories = async () => {
    try {
      const response = await productApi.listCategories()
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data)
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load categories" })
    }
  }

  const loadProducts = async () => {
    try {
      const response = await productApi.listProducts()
      if (response.data && Array.isArray(response.data)) {
        setProducts(response.data)
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load products" })
    }
  }

  const loadClients = async () => {
    try {
      const response = await clientApi.list()
      if (response.data && Array.isArray(response.data)) {
        setClients(response.data)
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load clients" })
    }
  }

  const loadClientProducts = async () => {
    if (!selectedClient) return
    try {
      const response = await productApi.getClientProducts(selectedClient)
      if (response.data && Array.isArray(response.data)) {
        setClientProducts(response.data)
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load client products" })
    }
  }

  const [editingIndustry, setEditingIndustry] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)

  const handleCreateIndustry = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append("name", industryForm.name)
      if (industryForm.description) formData.append("description", industryForm.description)
      formData.append("is_home", industryForm.is_home.toString())
      formData.append("is_top", industryForm.is_top.toString())
      if (industryImage) {
        formData.append("image", industryImage)
      }
      if (industryLogo) {
        formData.append("logo", industryLogo)
      }
      
      const response = await productApi.createIndustry(formData)
      if (response.data) {
        setMessage({ type: "success", text: "Industry created successfully" })
        setIndustryForm({ name: "", description: "", is_home: false, is_top: false })
        setIndustryImage(null)
        setIndustryLogo(null)
        loadIndustries()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to create industry" })
    } finally {
      setLoading(false)
    }
  }

  const handleEditIndustry = (industry: any) => {
    setEditingIndustry(industry.id)
    setIndustryForm({
      name: industry.name,
      description: industry.description || "",
      is_home: industry.is_home || false,
      is_top: industry.is_top || false
    })
    setIndustryImage(null)
    setIndustryLogo(null)
  }

  const handleUpdateIndustry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingIndustry) return
    
    setLoading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append("name", industryForm.name)
      if (industryForm.description) formData.append("description", industryForm.description)
      formData.append("is_home", industryForm.is_home.toString())
      formData.append("is_top", industryForm.is_top.toString())
      if (industryImage) {
        formData.append("image", industryImage)
      }
      if (industryLogo) {
        formData.append("logo", industryLogo)
      }
      
      const response = await productApi.updateIndustry(editingIndustry, formData)
      if (response.data || response.error === undefined) {
        setMessage({ type: "success", text: "Industry updated successfully" })
        setEditingIndustry(null)
        setIndustryForm({ name: "", description: "", is_home: false, is_top: false })
        setIndustryImage(null)
        setIndustryLogo(null)
        loadIndustries()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to update industry" })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteIndustry = async (industryId: string) => {
    if (!confirm("Are you sure you want to delete this industry?")) return
    
    setLoading(true)
    setMessage(null)
    try {
      const response = await productApi.deleteIndustry(industryId)
      if (response.error === undefined) {
        setMessage({ type: "success", text: "Industry deleted successfully" })
        loadIndustries()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to delete industry" })
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setEditingIndustry(null)
    setIndustryForm({ name: "", description: "", is_home: false, is_top: false })
    setIndustryImage(null)
    setIndustryLogo(null)
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append("industry_id", categoryForm.industry_id)
      formData.append("name", categoryForm.name)
      if (categoryForm.description) formData.append("description", categoryForm.description)
      if (categoryImage) {
        formData.append("image", categoryImage)
      }
      
      const response = await productApi.createCategory(formData)
      if (response.data) {
        setMessage({ type: "success", text: "Category created successfully" })
        setCategoryForm({ industry_id: "", name: "", description: "" })
        setCategoryImage(null)
        loadCategories()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to create category" })
    } finally {
      setLoading(false)
    }
  }

  const handleEditCategory = (category: any) => {
    setEditingCategory(category.id)
    setCategoryForm({
      industry_id: category.industry_id,
      name: category.name,
      description: category.description || ""
    })
    setCategoryImage(null)
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    
    setLoading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append("industry_id", categoryForm.industry_id)
      formData.append("name", categoryForm.name)
      if (categoryForm.description) formData.append("description", categoryForm.description)
      if (categoryImage) {
        formData.append("image", categoryImage)
      }
      
      const response = await productApi.updateCategory(editingCategory, formData)
      if (response.data || response.error === undefined) {
        setMessage({ type: "success", text: "Category updated successfully" })
        setEditingCategory(null)
        setCategoryForm({ industry_id: "", name: "", description: "" })
        setCategoryImage(null)
        loadCategories()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to update category" })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return
    
    setLoading(true)
    setMessage(null)
    try {
      const response = await productApi.deleteCategory(categoryId)
      if (response.error === undefined) {
        setMessage({ type: "success", text: "Category deleted successfully" })
        loadCategories()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to delete category" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append("category_id", productForm.category_id)
      formData.append("name", productForm.name)
      // Always include description, even if empty, to allow clearing it
      if (productForm.description !== undefined) {
        formData.append("description", productForm.description || "")
      }
      
      // Add multiple images
      productImages.forEach((file) => {
        formData.append("images", file)
      })
      
      const response = await productApi.createProduct(formData)
      if (response.data) {
        setMessage({ type: "success", text: "Product created successfully" })
        setProductForm({ category_id: "", name: "", description: "" })
        setProductImagesFiles([])
        loadProducts()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to create product" })
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = async (product: any) => {
    setEditingProduct(product.id)
    setProductForm({
      category_id: product.category_id,
      name: product.name,
      description: product.description || ""
    })
    setProductImagesFiles([])
    setImagesToDelete([])
    
    // Fetch existing product images
    try {
      const response = await productApi.getProductImages(product.id)
      console.log("Product images response:", response)
      // Handle both direct array response and wrapped response
      if (response.data) {
        const images = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : [])
        setExistingProductImages(images)
      } else if (Array.isArray(response)) {
        // If response is directly an array
        setExistingProductImages(response)
      } else {
        setExistingProductImages([])
      }
    } catch (error) {
      console.error("Failed to load product images:", error)
      setExistingProductImages([])
    }
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    
    setLoading(true)
    setMessage(null)
    try {
      // Delete images that were marked for deletion
      for (const imageId of imagesToDelete) {
        try {
          await productApi.deleteProductImage(imageId)
        } catch (error) {
          console.error(`Failed to delete image ${imageId}:`, error)
        }
      }
      
      const formData = new FormData()
      formData.append("category_id", productForm.category_id)
      formData.append("name", productForm.name)
      // Always include description, even if empty, to allow clearing it
      if (productForm.description !== undefined) {
        formData.append("description", productForm.description || "")
      }
      
      // Add multiple images if new ones are selected
      productImages.forEach((file) => {
        formData.append("images", file)
      })
      
      const response = await productApi.updateProduct(editingProduct, formData)
      if (response.data || response.error === undefined) {
        setMessage({ type: "success", text: "Product updated successfully" })
        setEditingProduct(null)
        setProductForm({ category_id: "", name: "", description: "" })
        setProductImagesFiles([])
        setExistingProductImages([])
        setImagesToDelete([])
        loadProducts()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to update product" })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExistingImage = (imageId: string) => {
    setImagesToDelete([...imagesToDelete, imageId])
    setExistingProductImages(existingProductImages.filter(img => img.id !== imageId))
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    
    setLoading(true)
    setMessage(null)
    try {
      const response = await productApi.deleteProduct(productId)
      if (response.error === undefined) {
        setMessage({ type: "success", text: "Product deleted successfully" })
        loadProducts()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to delete product" })
    } finally {
      setLoading(false)
    }
  }

  const handleAttachProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const response = await productApi.attachProduct(attachForm)
      if (response.data) {
        setMessage({ type: "success", text: "Product attached to client successfully" })
        setAttachForm({ client_id: "", product_id: "" })
        loadClientProducts()
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.error || "Failed to attach product" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage Industry → Category → Product hierarchy
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
          <TabsTrigger value="industries">Industries</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="client-products">Client Products</TabsTrigger>
        </TabsList>

        <TabsContent value="industries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingIndustry ? "Update Industry" : "Create Industry"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingIndustry ? handleUpdateIndustry : handleCreateIndustry} className="space-y-4">
                <div>
                  <Label htmlFor="industry-name">Name *</Label>
                  <Input
                    id="industry-name"
                    value={industryForm.name}
                    onChange={(e) => setIndustryForm({ ...industryForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="industry-description">Description</Label>
                  <Input
                    id="industry-description"
                    value={industryForm.description}
                    onChange={(e) => setIndustryForm({ ...industryForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="industry-image">Image</Label>
                  <Input
                    id="industry-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setIndustryImage(e.target.files?.[0] || null)}
                  />
                  {industryImage && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Selected: {industryImage.name}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="industry-logo">Logo</Label>
                  <Input
                    id="industry-logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setIndustryLogo(e.target.files?.[0] || null)}
                  />
                  {industryLogo && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Selected: {industryLogo.name}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="industry-is-home"
                      checked={industryForm.is_home}
                      onChange={(e) => setIndustryForm({ ...industryForm, is_home: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="industry-is-home" className="cursor-pointer">
                      Show on Home
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="industry-is-top"
                      checked={industryForm.is_top}
                      onChange={(e) => setIndustryForm({ ...industryForm, is_top: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="industry-is-top" className="cursor-pointer">
                      Top Industry
                    </Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingIndustry ? (
                    <>
                      <Button type="submit" disabled={loading}>
                        Update Industry
                      </Button>
                      <Button type="button" variant="outline" onClick={cancelEdit} disabled={loading}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button type="submit" disabled={loading}>
                      Create Industry
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Industries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {industries.map((industry) => (
                  <div key={industry.id} className="p-3 border rounded">
                    <div className="flex items-start gap-4">
                      {industry.image && (
                        <img 
                          src={getImageUrl(industry.image)}
                          alt={industry.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      {industry.logo && (
                        <img 
                          src={getImageUrl(industry.logo)}
                          alt={`${industry.name} logo`}
                          className="w-16 h-16 object-contain rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          {industry.name}
                          {industry.is_home && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Home</span>
                          )}
                          {industry.is_top && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Top</span>
                          )}
                        </div>
                        {industry.description && (
                          <div className="text-sm text-muted-foreground mt-1">{industry.description}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditIndustry(industry)}
                          disabled={loading}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteIndustry(industry.id)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingCategory ? "Update Category" : "Create Category"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
                <div>
                  <Label htmlFor="category-industry">Industry *</Label>
                  <Select
                    value={categoryForm.industry_id}
                    onValueChange={(value) => setCategoryForm({ ...categoryForm, industry_id: value })}
                  >
                    <SelectTrigger id="category-industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.id} value={industry.id}>
                          {industry.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category-name">Name *</Label>
                  <Input
                    id="category-name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category-description">Description</Label>
                  <Input
                    id="category-description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category-image">Image</Label>
                  <Input
                    id="category-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCategoryImage(e.target.files?.[0] || null)}
                  />
                  {categoryImage && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Selected: {categoryImage.name}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {editingCategory ? (
                    <>
                      <Button type="submit" disabled={loading}>
                        Update Category
                      </Button>
                      <Button type="button" variant="outline" onClick={() => {
                        setEditingCategory(null)
                        setCategoryForm({ industry_id: "", name: "", description: "" })
                        setCategoryImage(null)
                      }} disabled={loading}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button type="submit" disabled={loading}>
                      Create Category
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="p-3 border rounded">
                    <div className="flex items-start gap-4">
                      {category.image && (
                        <img 
                          src={getImageUrl(category.image)}
                          alt={category.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Industry: {category.industry_name}
                        </div>
                        {category.description && (
                          <div className="text-sm text-muted-foreground">{category.description}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          disabled={loading}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingProduct ? "Update Product" : "Create Product"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="space-y-4">
                <div>
                  <Label htmlFor="product-category">Category *</Label>
                  <Select
                    value={productForm.category_id}
                    onValueChange={(value) => setProductForm({ ...productForm, category_id: value })}
                  >
                    <SelectTrigger id="product-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({category.industry_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="product-name">Name *</Label>
                  <Input
                    id="product-name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="product-description">Description</Label>
                  <RichTextEditor
                    value={productForm.description || ""}
                    onChange={(value) => setProductForm({ ...productForm, description: value })}
                    placeholder="Enter product description..."
                  />
                </div>
                {editingProduct && existingProductImages.length > 0 && (
                  <div>
                    <Label>Existing Images</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {existingProductImages.map((image) => (
                        <div key={image.id} className="relative border rounded p-2">
                          <img
                            src={getImageUrl(image.image_url)}
                            alt={`Product image ${image.display_order}`}
                            className="w-full h-32 object-cover rounded mb-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E'
                            }}
                          />
                          <div className="text-xs text-muted-foreground mb-2">
                            Order: {image.display_order}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            onClick={() => handleDeleteExistingImage(image.id)}
                            disabled={loading}
                          >
                            Delete
                          </Button>
                        </div>
                      ))}
                    </div>
                    {imagesToDelete.length > 0 && (
                      <div className="mt-2 text-sm text-orange-600">
                        {imagesToDelete.length} image(s) marked for deletion
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <Label htmlFor="product-images">
                    {editingProduct ? "Add New Images (Multiple)" : "Images (Multiple)"}
                  </Label>
                  <Input
                    id="product-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setProductImagesFiles(files)
                    }}
                  />
                  {productImages.length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Selected: {productImages.length} file(s)
                      <ul className="list-disc list-inside mt-1">
                        {productImages.map((file, idx) => (
                          <li key={idx}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {editingProduct ? (
                    <>
                      <Button type="submit" disabled={loading}>
                        Update Product
                      </Button>
                      <Button type="button" variant="outline" onClick={() => {
                        setEditingProduct(null)
                        setProductForm({ category_id: "", name: "", description: "" })
                        setProductImagesFiles([])
                        setExistingProductImages([])
                        setImagesToDelete([])
                      }} disabled={loading}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button type="submit" disabled={loading}>
                      Create Product
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {products.map((product) => (
                  <div key={product.id} className="p-3 border rounded">
                    <div className="flex items-start justify-between gap-4">
                      {product.first_image && (
                        <img
                          src={getImageUrl(product.first_image)}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Category: {product.category_name}
                        </div>
                        {product.description && (
                          <div 
                            className="text-sm text-muted-foreground whitespace-pre-wrap prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          disabled={loading}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="client-products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attach Product to Client</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAttachProduct} className="space-y-4">
                <div>
                  <Label htmlFor="attach-client">Client *</Label>
                  <Select
                    value={attachForm.client_id}
                    onValueChange={(value) => setAttachForm({ ...attachForm, client_id: value })}
                  >
                    <SelectTrigger id="attach-client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.client_id} value={client.client_id}>
                          {client.name} ({client.client_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="attach-product">Product *</Label>
                  <Select
                    value={attachForm.product_id}
                    onValueChange={(value) => setAttachForm({ ...attachForm, product_id: value })}
                  >
                    <SelectTrigger id="attach-product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={loading}>
                  Attach Product
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="view-client">Select Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger id="view-client">
                    <SelectValue placeholder="Select client to view products" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.client_id} value={client.client_id}>
                        {client.name} ({client.client_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {clientProducts.length > 0 && (
                <div className="space-y-2">
                  {clientProducts.map((cp) => (
                    <div key={cp.product_id} className="p-3 border rounded">
                      <div className="font-medium">{cp.product_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Enabled: {cp.enabled ? "Yes" : "No"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

