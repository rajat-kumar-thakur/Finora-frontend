/**
 * Upload Page
 * 
 * PDF upload and transaction ingestion.
 */

'use client'

import { useState } from 'react'
import { PdfUpload } from '@/components/pdf-upload'
import { TransactionList } from '@/components/transaction-list'

export default function UploadPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadSuccess = () => {
    // Trigger transaction list refresh
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">
          Upload Transactions
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Upload bank statement PDF to automatically extract transactions
        </p>
      </div>

      {/* Upload Section */}
      <PdfUpload onUploadSuccess={handleUploadSuccess} />

      {/* Recent Uploads */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          Recent Transactions
        </h2>
        <TransactionList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
}
