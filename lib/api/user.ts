/**
 * User API Client
 *
 * Type-safe API methods for user profile and settings.
 */

import { apiClient } from './client'

export interface User {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  created_at: string
  role: string
}

export interface ProfileUpdate {
  full_name: string
}

export interface EmailChangeRequest {
  new_email: string
  password: string
}

export interface PasswordChangeRequest {
  current_password: string
  new_password: string
}

export const userApi = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    return apiClient.get<User>('/api/v1/users/me')
  },

  /**
   * Update user profile (full name)
   */
  updateProfile: async (data: ProfileUpdate): Promise<User> => {
    return apiClient.put<User>('/api/v1/users/me', data)
  },

  /**
   * Change email address
   */
  changeEmail: async (data: EmailChangeRequest): Promise<User> => {
    return apiClient.put<User>('/api/v1/users/me/email', data)
  },

  /**
   * Change password
   */
  changePassword: async (data: PasswordChangeRequest): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>('/api/v1/users/me/password', data)
  },
}
