/**
 * Transactions Page
 * 
 * View all transactions with filters and export.
 */

'use client'

import { TransactionList } from '@/components/transaction-list'
import { ExportButton } from '@/components/export-button'

export default function TransactionsPage() {
  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Transactions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            View and manage all your transactions
          </p>
        </div>

        <ExportButton />
      </div>

      {/* Transaction List */}
      <TransactionList filters={{ page: 1, page_size: 50 }} />
    </div>
  )
}
