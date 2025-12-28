"use client"

/**
 * Export Button Component
 * 
 * Handles transaction export to PDF/Excel/CSV.
 */

import { useState } from 'react'
import { exportApi, downloadBlob, type ExportFilters } from '@/lib/api'

interface ExportButtonProps {
  filters?: ExportFilters
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setExporting(true)
    setError(null)

    try {
      let blob: Blob
      let filename: string
      
      const timestamp = new Date().toISOString().split('T')[0]

      switch (format) {
        case 'pdf':
          blob = await exportApi.exportPdf(filters)
          filename = `finora_transactions_${timestamp}.pdf`
          break
        case 'excel':
          blob = await exportApi.exportExcel(filters)
          filename = `finora_transactions_${timestamp}.xlsx`
          break
        case 'csv':
          blob = await exportApi.exportCsv(filters)
          filename = `finora_transactions_${timestamp}.csv`
          break
      }

      downloadBlob(blob, filename)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleExport('pdf')}
          disabled={exporting}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 text-sm font-medium"
        >
          {exporting ? 'Exporting...' : '📄 Export PDF'}
        </button>

        <button
          onClick={() => handleExport('excel')}
          disabled={exporting}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
        >
          {exporting ? 'Exporting...' : '📊 Export Excel'}
        </button>

        <button
          onClick={() => handleExport('csv')}
          disabled={exporting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
        >
          {exporting ? 'Exporting...' : '📝 Export CSV'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}
