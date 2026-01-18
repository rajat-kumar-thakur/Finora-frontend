/**
 * Transactions Page
 * 
 * View all transactions with filters and export.
 */

'use client'

import { TransactionList } from '@/components/transaction-list'
import { ExportButton } from '@/components/export-button'
import { TransactionCreateModal } from '@/components/transaction-create-modal'
import { useState } from 'react'

export default function TransactionsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [refresh, setRefresh] = useState(0)

  const handleCreated = () => {
    setShowCreate(false)
    setRefresh((n) => n + 1)
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="header-row">
        <div className="page-header">
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">View and manage all your transactions</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="hidden sm:flex btn-primary"
          >
            + Add Transaction
          </button>
          <ExportButton />
        </div>
      </div>

      {/* Transaction List */}
      <TransactionList filters={{ page: 1, page_size: 50 }} refreshTrigger={refresh} />

      {showCreate && (
        <TransactionCreateModal
          onClose={() => setShowCreate(false)}
          onSaved={handleCreated}
        />
      )}
    </div>
  )
}
