"use client"

/**
 * Export Button Component
 *
 * Handles transaction export to PDF/Excel/CSV.
 */

import { useState } from 'react'
import { exportApi, downloadBlob, type ExportFilters } from '@/lib/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, ChevronDown, FileText, FileSpreadsheet, FileDown } from 'lucide-react'

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" disabled={exporting} className="btn-outline">
            {exporting ? <span className="spinner-sm" /> : <Download className="h-4 w-4" />}
            Export
            <ChevronDown className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            <FileText />
            PDF document
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('excel')}>
            <FileSpreadsheet />
            Excel workbook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <FileDown />
            CSV file
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {error && (
        <div className="alert-error">{error}</div>
      )}
    </div>
  )
}
