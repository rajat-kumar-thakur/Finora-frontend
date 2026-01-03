/**
 * Upload Page
 *
 * PDF and image upload for transaction ingestion.
 */

'use client'

import { useState } from 'react'
import { PdfUpload } from '@/components/pdf-upload'
import { ImageUpload } from '@/components/image-upload'
import { TransactionList } from '@/components/transaction-list'

type UploadTab = 'pdf' | 'image'

export default function UploadPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState<UploadTab>('pdf')

  const handleUploadSuccess = () => {
    // Trigger transaction list refresh
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          Upload Transactions
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Upload bank statement PDF or image to extract transactions
        </p>
      </div>

      {/* Upload Type Tabs */}
      <div className="flex gap-1 sm:gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('pdf')}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'pdf'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          PDF Upload
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'image'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          Image Upload
        </button>
      </div>

      {/* Upload Section */}
      {activeTab === 'pdf' ? (
        <PdfUpload onUploadSuccess={handleUploadSuccess} />
      ) : (
        <ImageUpload onUploadSuccess={handleUploadSuccess} />
      )}

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
