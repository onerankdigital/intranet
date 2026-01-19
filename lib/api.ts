// Get API URL from environment or auto-detect based on current host
function getApiBaseUrl(): string {
  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // Auto-detect: if running on network IP, use same host with port 8000
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    // If not localhost, use the same hostname
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:8000`
    }
  }
  
  // Default to localhost
  return "http://localhost:8000"
}

const API_BASE_URL = getApiBaseUrl()

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  detail?: string
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null
  private onUnauthorized: (() => void) | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("access_token")
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (token && typeof window !== "undefined") {
      localStorage.setItem("access_token", token)
    } else if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
    }
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Handle 204 No Content - no body to parse
      if (response.status === 204) {
        if (!response.ok) {
          return {
            error: `Error: ${response.status} ${response.statusText}`,
          }
        }
        return { data: null as T }
      }

      let data
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json()
        } catch (jsonError) {
          return {
            error: `Failed to parse response: ${response.status} ${response.statusText}`,
          }
        }
      } else {
        const text = await response.text()
        data = text ? { detail: text } : { detail: `Error: ${response.status} ${response.statusText}` }
      }

      if (!response.ok) {
        return {
          error: data.detail || data.error || "An error occurred",
          detail: data.detail,
        }
      }

      return { data }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    })
  }

  async delete<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {}
    
    // Don't set Content-Type for FormData - browser will set it with boundary
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      })

      if (response.status === 204) {
        if (!response.ok) {
          return {
            error: `Error: ${response.status} ${response.statusText}`,
          }
        }
        return { data: null as T }
      }

      let data
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json()
        } catch (jsonError) {
          return {
            error: `Failed to parse response: ${response.status} ${response.statusText}`,
          }
        }
      } else {
        const text = await response.text()
        data = text ? { detail: text } : { detail: `Error: ${response.status} ${response.statusText}` }
      }

      // Handle 401 Unauthorized - token expired
      if (response.status === 401) {
        this.setToken(null)
        if (this.onUnauthorized) {
          this.onUnauthorized()
        }
        return {
          error: "Token expired. Please login again.",
          detail: data.detail || data.error || "Unauthorized",
        }
      }

      if (!response.ok) {
        return {
          error: data.detail || data.error || "An error occurred",
          detail: data.detail,
        }
      }

      return { data }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  async putFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {}
    
    // Don't set Content-Type for FormData - browser will set it with boundary
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: formData,
      })

      if (response.status === 204) {
        if (!response.ok) {
          return {
            error: `Error: ${response.status} ${response.statusText}`,
          }
        }
        return { data: null as T }
      }

      let data
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json()
        } catch (jsonError) {
          return {
            error: `Failed to parse response: ${response.status} ${response.statusText}`,
          }
        }
      } else {
        const text = await response.text()
        data = text ? { detail: text } : { detail: `Error: ${response.status} ${response.statusText}` }
      }

      // Handle 401 Unauthorized - token expired
      if (response.status === 401) {
        this.setToken(null)
        if (this.onUnauthorized) {
          this.onUnauthorized()
        }
        return {
          error: "Token expired. Please login again.",
          detail: data.detail || data.error || "Unauthorized",
        }
      }

      if (!response.ok) {
        return {
          error: data.detail || data.error || "An error occurred",
          detail: data.detail,
        }
      }

      return { data }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    apiClient.post("/api/auth/register", data),

  createUser: (data: { email: string; password: string; is_admin?: boolean }) =>
    apiClient.post("/api/auth/create-user", data),

  login: (data: { email: string; password: string }) =>
    apiClient.post("/api/auth/login", data),

  refresh: (data: { refresh_token: string }) =>
    apiClient.post("/api/auth/refresh", data),

  me: () => apiClient.get("/api/auth/me"),
  
  getMyPermissions: () => apiClient.get("/api/auth/me/permissions"),
  
  listUsers: () => apiClient.get("/api/auth/users"),
}

// Client API
export const clientApi = {
  create: (data: { client_id: string; name: string; status?: string }) =>
    apiClient.post("/api/clients", data),

  createWithFormData: (formData: FormData) =>
    apiClient.postFormData("/api/clients", formData),

  list: () => apiClient.get("/api/clients"),

  get: (clientId: string) => apiClient.get(`/api/clients/${clientId}`),

  getBalance: (clientId: string) => apiClient.get(`/api/clients/${clientId}/balance`),

  submitOrder: (data: any) => apiClient.post("/api/orders/submit", data),

  update: (clientId: string, data: any) => apiClient.put(`/api/clients/${clientId}`, data),

  updateWithFormData: (clientId: string, formData: FormData) =>
    apiClient.putFormData(`/api/clients/${clientId}`, formData),

  delete: (clientId: string) => apiClient.delete(`/api/clients/${clientId}`),

  getIntegration: (clientId: string) => apiClient.get(`/api/clients/${clientId}/integrations`),

  updateIntegration: (clientId: string, data: { whatsapp_enabled?: string; google_sheets_enabled?: string; google_sheet_id?: string; meta_page_id?: string; meta_form_id?: string }) =>
    apiClient.put(`/api/clients/${clientId}/integrations`, data),
}

// Lead API
export const leadApi = {
  ingest: (data: any, apiKey?: string) => {
    const headers: HeadersInit = {}
    if (apiKey) {
      headers["X-API-Key"] = apiKey
    }
    return fetch(`${API_BASE_URL}/api/leads/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    }).then((res) => res.json())
  },

  list: () => apiClient.get("/api/leads"),

  get: (leadId: string) => apiClient.get(`/api/leads/${leadId}`),
}

// Webhook API
export const webhookApi = {
  meta: {
    verify: (params: Record<string, string>) =>
      apiClient.get(`/webhook/meta?${new URLSearchParams(params).toString()}`),
    handle: (data: any) => apiClient.post("/webhook/meta", data),
  },
}

// Roles API
export const roleApi = {
  create: (data: { name: string; level: string; description?: string; status?: string }) =>
    apiClient.post("/api/roles", data),
  
  list: () => apiClient.get("/api/roles"),
  
  get: (roleId: string) => apiClient.get(`/api/roles/${roleId}`),
  
  update: (roleId: string, data: { name?: string; level?: string; description?: string; status?: string }) =>
    apiClient.put(`/api/roles/${roleId}`, data),
  
  getPermissions: (roleId: string) => apiClient.get(`/api/roles/${roleId}/permissions`),
}

// Permissions API
export const permissionApi = {
  create: (data: { method: string; path: string; description?: string }) =>
    apiClient.post("/api/permissions", data),
  
  list: () => apiClient.get("/api/permissions"),
  
  get: (permissionId: string) => apiClient.get(`/api/permissions/${permissionId}`),
  
  getAvailableEndpoints: () => apiClient.get("/api/endpoints"),
}

// Role-Permission API
export const rolePermissionApi = {
  assign: (data: { role_id: string; permission_id: string }) =>
    apiClient.post("/api/role-permissions", data),
  
  remove: (data: { role_id: string; permission_id: string }) =>
    apiClient.delete("/api/role-permissions", data),
}

// User-Client API
export const userClientApi = {
  create: (data: { user_id: string; client_id: string; role_id: string; reports_to_user_client_id?: string; status?: string }) =>
    apiClient.post("/api/user-clients", data),
  
  list: (params?: { user_id?: string; client_id?: string }) => {
    const query = new URLSearchParams()
    if (params?.user_id) query.append("user_id", params.user_id)
    if (params?.client_id) query.append("client_id", params.client_id)
    return apiClient.get(`/api/user-clients${query.toString() ? `?${query.toString()}` : ""}`)
  },
  
  get: (userClientId: string) => apiClient.get(`/api/user-clients/${userClientId}`),
  
  update: (userClientId: string, data: { role_id?: string; reports_to_user_client_id?: string; status?: string }) =>
    apiClient.put(`/api/user-clients/${userClientId}`, data),
  
  getUserClients: (userId: string) => apiClient.get(`/api/users/${userId}/clients`),
}

// Hierarchy API
export const hierarchyApi = {
  rebuild: (clientId: string) => apiClient.post(`/api/hierarchy/rebuild/${clientId}`),
  
  getDescendants: (userClientId: string, includeSelf: boolean = false) => {
    const params = new URLSearchParams()
    if (includeSelf) params.append("include_self", "true")
    return apiClient.get(`/api/hierarchy/${userClientId}/descendants${params.toString() ? `?${params.toString()}` : ""}`)
  },
  
  getTree: (userClientId: string) => apiClient.get(`/api/hierarchy/${userClientId}/tree`),
  
  checkAccess: (data: { requester_user_client_id: string; target_user_client_id: string }) =>
    apiClient.post("/api/hierarchy/check-access", data),
}

// Product API
export const productApi = {
  // Industries
  createIndustry: (formData: FormData) =>
    apiClient.postFormData("/api/industries", formData),
  
  listIndustries: () => apiClient.get("/api/industries"),
  
  getIndustry: (industryId: string) => apiClient.get(`/api/industries/${industryId}`),
  
  getTopIndustries: () => apiClient.get("/api/industries/top"),
  
  getHomeIndustries: () => apiClient.get("/api/industries/home"),
  
  updateIndustry: (industryId: string, formData: FormData) =>
    apiClient.putFormData(`/api/industries/${industryId}`, formData),
  
  deleteIndustry: (industryId: string) => apiClient.delete(`/api/industries/${industryId}`),
  
  // Product Categories
  createCategory: (formData: FormData) =>
    apiClient.postFormData("/api/product-categories", formData),
  
  listCategories: (industryId?: string) => {
    const params = new URLSearchParams()
    if (industryId) params.append("industry_id", industryId)
    return apiClient.get(`/api/product-categories${params.toString() ? `?${params.toString()}` : ""}`)
  },
  
  updateCategory: (categoryId: string, formData: FormData) =>
    apiClient.putFormData(`/api/product-categories/${categoryId}`, formData),
  
  deleteCategory: (categoryId: string) => apiClient.delete(`/api/product-categories/${categoryId}`),
  
  // Products
  createProduct: (formData: FormData) =>
    apiClient.postFormData("/api/products", formData),
  
  listProducts: (categoryId?: string) => {
    const params = new URLSearchParams()
    if (categoryId) params.append("category_id", categoryId)
    return apiClient.get(`/api/products${params.toString() ? `?${params.toString()}` : ""}`)
  },
  
  getProduct: (productId: string) => apiClient.get(`/api/products/${productId}`),
  
  updateProduct: (productId: string, formData: FormData) =>
    apiClient.putFormData(`/api/products/${productId}`, formData),
  
  deleteProduct: (productId: string) => apiClient.delete(`/api/products/${productId}`),
  
  // Client Products
  attachProduct: (data: { client_id: string; product_id: string; enabled?: boolean }) =>
    apiClient.post("/api/client-products", data),
  
  getClientProducts: (clientId: string) => apiClient.get(`/api/clients/${clientId}/products`),
  
  // Product Images
  createProductImage: (data: { product_id: string; image_url: string; display_order?: number }) =>
    apiClient.post("/api/product-images", data),
  
  listProductImages: (productId?: string) => {
    const params = new URLSearchParams()
    if (productId) params.append("product_id", productId)
    return apiClient.get(`/api/product-images${params.toString() ? `?${params.toString()}` : ""}`)
  },
  
  getProductImage: (imageId: string) => apiClient.get(`/api/product-images/${imageId}`),
  
  updateProductImage: (imageId: string, data: { image_url?: string; display_order?: number }) =>
    apiClient.put(`/api/product-images/${imageId}`, data),
  
  deleteProductImage: (imageId: string) => apiClient.delete(`/api/product-images/${imageId}`),
  
  getProductImages: (productId: string) => apiClient.get(`/api/products/${productId}/images`),
}

// Content API (for ordpanel/public content)
export const contentApi = {
  getAboutUs: () => apiClient.get("/api/about-us"),
  
  createAboutUs: (data: { title?: string; subtitle?: string; description?: string; status?: string }) =>
    apiClient.post("/api/about-us", data),
  
  updateAboutUs: (aboutUsId: string, data: { title?: string; subtitle?: string; description?: string; status?: string }) =>
    apiClient.put(`/api/about-us/${aboutUsId}`, data),
  
  getContactDetails: () => apiClient.get("/api/contact-details"),
  
  createContactDetails: (data: {
    company_name?: string;
    email?: string[];
    phone?: string[];
    address?: string;
    website?: string[];
    social_media?: Record<string, string>;
    status?: string;
  }) => apiClient.post("/api/contact-details", data),
  
  updateContactDetails: (contactId: string, data: {
    company_name?: string;
    email?: string[];
    phone?: string[];
    address?: string;
    website?: string[];
    social_media?: Record<string, string>;
    status?: string;
  }) => apiClient.put(`/api/contact-details/${contactId}`, data),
}

// Client API extensions
export const clientApiExtended = {
  getPremiumClients: () => apiClient.get("/api/clients/premium"),
}

// API Key API
export const apiKeyApi = {
  generate: (data: { client_id: string; scopes?: string[]; expires_at?: string }) =>
    apiClient.post("/api/api-keys/generate", data),
  
  list: (clientId?: string) => {
    const params = new URLSearchParams()
    if (clientId) params.append("client_id", clientId)
    return apiClient.get(`/api/api-keys${params.toString() ? `?${params.toString()}` : ""}`)
  },
  
  update: (apiKeyId: string, data: { status?: string }) =>
    apiClient.patch(`/api/api-keys/${apiKeyId}`, data),
  
  delete: (apiKeyId: string) =>
    apiClient.delete(`/api/api-keys/${apiKeyId}`),
}

// Transaction API
export const transactionApi = {
  create: (data: { client_id: string; transaction_id: string; amount: number; notes?: string }) =>
    apiClient.post("/api/transactions", data),
  
  list: (params?: { client_id?: string; status?: string; skip?: number; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.client_id) query.append("client_id", params.client_id)
    if (params?.status) query.append("status", params.status)
    if (params?.skip) query.append("skip", params.skip.toString())
    if (params?.limit) query.append("limit", params.limit.toString())
    return apiClient.get(`/api/transactions${query.toString() ? `?${query.toString()}` : ""}`)
  },
  
  get: (transactionId: string) => apiClient.get(`/api/transactions/${transactionId}`),
  
  verify: (transactionId: string, data: { status: string; verified_by_user_id: string; rejection_reason?: string; notes?: string }) =>
    apiClient.patch(`/api/transactions/${transactionId}/verify`, data),
}

