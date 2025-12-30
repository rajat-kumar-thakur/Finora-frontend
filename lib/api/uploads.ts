/**
 * Upload API Client
 *
 * Type-safe API methods for file uploads (PDF and images).
 */

import { env } from '@/lib/config/env'
import { getAccessToken } from './auth'

export interface UploadResponse {
  success_count: number
  duplicate_count: number
  error_count: number
  errors: string[]
  message: string
}

// Alias for backward compatibility
export type UploadPdfResponse = UploadResponse
export type UploadImageResponse = UploadResponse

export const uploadApi = {
  /**
   * Upload bank statement PDF and extract transactions
   */
  uploadPdf: async (file: File): Promise<UploadPdfResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    // Get auth token using the proper auth function
    const token = getAccessToken()

    const response = await fetch(`${env.apiBaseUrl}/api/v1/uploads/pdf`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.detail || 'Upload failed')
    }

    return response.json()
  },

  /**
   * Upload bank statement image and extract transactions
   * Supported formats: JPG, JPEG, PNG, WEBP
   */
  uploadImage: async (file: File): Promise<UploadImageResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    // Get auth token using the proper auth function
    const token = getAccessToken()

    const response = await fetch(`${env.apiBaseUrl}/api/v1/uploads/image`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.detail || 'Upload failed')
    }

    return response.json()
  },
}
