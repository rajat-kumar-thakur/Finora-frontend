"use client"

/**
 * Category Breakdown Component
 * 
 * Shows spending by category.
 */

import { useState, useEffect, useCallback } from 'react'
import { summaryApi, type CategoryBreakdownItem } from '@/lib/api'

export function CategoryBreakdown() {
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactionType, setTransactionType] = useState<'debit' | 'credit'>('debit')

  const loadBreakdown = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await summaryApi.categoryBreakdown({
        transaction_type: transactionType,
      })
      setBreakdown(data.breakdown)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load breakdown')
    } finally {
      setLoading(false)
    }
  }, [transactionType])

  useEffect(() => {
    loadBreakdown()
  }, [loadBreakdown])

  const total = breakdown.reduce((sum, item) => sum + item.total, 0)

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Category Breakdown</h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => setTransactionType('debit')}
            className={`px-3 py-1 text-sm rounded-md ${
              transactionType === 'debit'
                ? 'bg-red-400 text-white shadow-sm'
                : 'bg-accent text-foreground/90 hover:bg-accent/80'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setTransactionType('credit')}
            className={`px-3 py-1 text-sm rounded-md ${
              transactionType === 'credit'
                ? 'bg-green-400 text-white shadow-sm'
                : 'bg-accent text-foreground/90 hover:bg-accent/80'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {breakdown.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No {transactionType === 'debit' ? 'expenses' : 'income'} found
        </p>
      ) : (
        <div className="space-y-3">
          {breakdown.map((item) => {
            const percentage = total > 0 ? (item.total / total) * 100 : 0

            return (
              <div key={item.category_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {item.category_name}
                  </span>
                  <span className="text-muted-foreground">
                    ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        transactionType === 'debit' ? 'bg-red-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {item.count} transaction{item.count !== 1 ? 's' : ''}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {breakdown.length > 0 && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-foreground">Total</span>
            <span className={transactionType === 'debit' ? 'text-red-400' : 'text-green-400'}>
              ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
