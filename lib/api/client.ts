/**
 * API Client
 * 
 * Centralized HTTP client for all API interactions.
 * Provides typed request/response handling, token injection, and error handling.
 */

import { env } from '@/lib/config/env'

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>
}

class ApiClient {
  private baseUrl: string
  private getAuthToken: () => string | null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Placeholder for auth token retrieval
    // Will be implemented in auth phase
    this.getAuthToken = () => null
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(endpoint, this.baseUrl)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }
    
    return url.toString()
  }

  /**
   * Get default headers with auth token injection
   */
  private getHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders)
    
    // Set content type if not already set
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    
    // Inject auth token when available
    const token = this.getAuthToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    
    return headers
  }

  /**
   * Make HTTP request with automatic token refresh
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {},
    isRetry: boolean = false
  ): Promise<T> {
    const { params, headers: customHeaders, ...fetchConfig } = config

    const url = this.buildUrl(endpoint, params)
    const headers = this.getHeaders(customHeaders)

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers,
      })

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && !isRetry && !endpoint.includes('/auth/')) {
        // Try to refresh the token
        const refreshed = await this.tryRefreshToken()

        if (refreshed) {
          // Retry the request with new token
          return this.request<T>(endpoint, config, true)
        }

        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        throw new ApiError(401, 'Unauthorized', { detail: 'Session expired' })
      }

      // Handle other non-2xx responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new ApiError(response.status, response.statusText, errorData)
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null as T
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      // Network errors or other fetch failures
      throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Try to refresh the access token
   * Returns true if successful, false otherwise
   */
  private async tryRefreshToken(): Promise<boolean> {
    try {
      // Import dynamically to avoid circular dependency
      const { refreshAccessToken } = await import('./auth')
      await refreshAccessToken()
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }

  /**
   * Set auth token retrieval function
   * To be called when auth is implemented
   */
  setAuthTokenGetter(getter: () => string | null): void {
    this.getAuthToken = getter
  }
}

// Export singleton instance
export const apiClient = new ApiClient(env.apiBaseUrl)

// Export type-safe API methods
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
}
