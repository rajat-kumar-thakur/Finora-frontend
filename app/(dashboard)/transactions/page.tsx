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
    <div className="space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
            Transactions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            View and manage all your transactions
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="hidden sm:flex px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
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
