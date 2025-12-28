/**
 * Category API Client
 * 
 * Type-safe API methods for category operations.
 */

import { apiClient } from './client'

export interface Category {
  id: string
  name: string
  color: string
  icon: string | null
  type: 'system' | 'user'
  created_at: string
}

export interface CategoryCreate {
  name: string
  color?: string
  icon?: string
}

export const categoryApi = {
  /**
   * List all categories (system + user)
   */
  list: async (): Promise<Category[]> => {
    return apiClient.get<Category[]>('/api/v1/categories')
  },

  /**
   * Get a single category
   */
  get: async (id: string): Promise<Category> => {
    return apiClient.get<Category>(`/api/v1/categories/${id}`)
  },

  /**
   * Create a custom category
   */
  create: async (data: CategoryCreate): Promise<Category> => {
    return apiClient.post<Category>('/api/v1/categories', data)
  },

  /**
   * Update a category
   */
  update: async (id: string, data: Partial<CategoryCreate>): Promise<Category> => {
    return apiClient.put<Category>(`/api/v1/categories/${id}`, data)
  },

  /**
   * Delete a custom category
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/v1/categories/${id}`)
  },
}
