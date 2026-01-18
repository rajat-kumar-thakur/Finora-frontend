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
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Upload Transactions</h1>
        <p className="page-subtitle">Upload bank statement PDF or image to extract transactions</p>
      </div>

      {/* Upload Type Tabs */}
      <div className="tab-pill-container">
        <button
          type="button"
          onClick={() => setActiveTab('pdf')}
          className={`tab-pill ${activeTab === 'pdf' ? 'tab-pill-active' : 'tab-pill-inactive'}`}
        >
          PDF Upload
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={`tab-pill ${activeTab === 'image' ? 'tab-pill-active' : 'tab-pill-inactive'}`}
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
        <h2 className="section-title mb-4">Recent Transactions</h2>
        <TransactionList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
}
