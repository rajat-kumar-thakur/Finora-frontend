"use client"

/**
 * Category Transactions (inline drill-down)
 *
 * Read-only list of the transactions that make up a single category for the
 * period currently selected on the Insights page. Rendered inline beneath a
 * category row in CategoryBreakdown. Reuses the existing transactions list
 * endpoint — no new backend.
 */

import { useEffect, useState } from 'react'
import { transactionApi, type Transaction, type TransactionFilter } from '@/lib/api/transactions'
import { formatCurrency } from '@/lib/utils'

interface CategoryTransactionsInlineProps {
  categoryId: string
  filters: {
    start_date?: string
    end_date?: string
    transaction_type?: 'debit' | 'credit'
  }
}

const PAGE_SIZE = 100

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
}

export function CategoryTransactionsInline({ categoryId, filters }: CategoryTransactionsInlineProps) {
  // Depend on primitive fields (not the object identity) so we don't refetch on
  // every parent re-render.
  const { start_date, end_date, transaction_type } = filters

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      // Build the filter with only defined keys — the API client stringifies
      // every param via String(value), so an undefined would become "undefined".
      const params: TransactionFilter = { category_id: categoryId, page: 1, page_size: PAGE_SIZE }
      if (start_date) params.start_date = start_date
      if (end_date) params.end_date = end_date
      if (transaction_type) params.transaction_type = transaction_type

      try {
        const res = await transactionApi.list(params)
        if (cancelled) return
        setTransactions(res.transactions)
        setTotal(res.pagination.total)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load transactions')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [categoryId, start_date, end_date, transaction_type])

  return (
    <div className="mt-1 mb-3 ml-1 pl-3 border-l-2 border-border">
      {loading ? (
        <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
          <span className="spinner-sm" />
          Loading transactions…
        </div>
      ) : error ? (
        <p className="text-xs text-destructive py-2">{error}</p>
      ) : transactions.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No transactions for this period.</p>
      ) : (
        <div className="divide-y divide-border/50">
          {transactions.map((tx) => {
            const isCredit = tx.transaction_type === 'credit'
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-4 py-2 px-2 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap w-[4.75rem] shrink-0">
                    {formatDate(tx.date)}
                  </span>
                  <span className="text-sm text-foreground truncate">
                    {tx.description}
                    {tx.account_name ? (
                      <span className="text-xs text-muted-foreground"> · {tx.account_name}</span>
                    ) : null}
                  </span>
                </div>
                <span
                  className={`text-sm tabular-nums whitespace-nowrap font-semibold shrink-0 font-numeric ${
                    isCredit ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {isCredit ? '+' : '−'}
                  {formatCurrency(Math.abs(tx.amount))}
                </span>
              </div>
            )
          })}
        </div>
      )}
      {total > transactions.length && !loading && !error && (
        <p className="text-[11px] text-muted-foreground pt-2 px-2">
          Showing first {transactions.length} of {total}. Open{' '}
          <a href="/transactions" className="underline hover:text-foreground">
            Transactions
          </a>{' '}
          for the full list.
        </p>
      )}
    </div>
  )
}
