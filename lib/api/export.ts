/**
 * Export API Client
 * 
 * Methods for exporting transaction data.
 */

import { env } from '@/lib/config/env'
import { getAccessToken } from '@/lib/api/auth'

export interface ExportFilters {
  start_date?: string
  end_date?: string
  transaction_type?: 'debit' | 'credit'
  category_id?: string
}

export const exportApi = {
  /**
   * Export transactions as PDF
   */
  exportPdf: async (filters?: ExportFilters): Promise<Blob> => {
    const params = new URLSearchParams(filters as Record<string, string>)
    const url = `${env.apiBaseUrl}/api/v1/export/pdf?${params.toString()}`

    const token = getAccessToken()

    const response = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      throw new Error('Export failed')
    }

    return response.blob()
  },

  /**
   * Export transactions as Excel
   */
  exportExcel: async (filters?: ExportFilters): Promise<Blob> => {
    const params = new URLSearchParams(filters as Record<string, string>)
    const url = `${env.apiBaseUrl}/api/v1/export/excel?${params.toString()}`

    const token = getAccessToken()

    const response = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      throw new Error('Export failed')
    }

    return response.blob()
  },

  /**
   * Export transactions as CSV
   */
  exportCsv: async (filters?: ExportFilters): Promise<Blob> => {
    const params = new URLSearchParams(filters as Record<string, string>)
    const url = `${env.apiBaseUrl}/api/v1/export/csv?${params.toString()}`

    const token = getAccessToken()

    const response = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      throw new Error('Export failed')
    }

    return response.blob()
  },
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
