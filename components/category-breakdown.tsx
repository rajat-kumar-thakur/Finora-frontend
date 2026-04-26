"use client"

/**
 * Category Breakdown Component
 *
 * Shows spending or earning by category, or net (income − expense) per category.
 */

import { useState, useEffect, useCallback } from 'react'
import { summaryApi, type CategoryBreakdownItem } from '@/lib/api'

type Mode = 'debit' | 'credit' | 'net'

interface NetItem {
  category_id: string
  category_name: string
  income: number
  expense: number
  net: number
  count: number
}

function formatINR2(amount: number): string {
  return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function CategoryBreakdown() {
  const [mode, setMode] = useState<Mode>('debit')
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([])
  const [netItems, setNetItems] = useState<NetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBreakdown = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (mode === 'net') {
        const [debitRes, creditRes] = await Promise.all([
          summaryApi.categoryBreakdown({ transaction_type: 'debit' }),
          summaryApi.categoryBreakdown({ transaction_type: 'credit' }),
        ])

        const map = new Map<string, NetItem>()
        for (const item of debitRes.breakdown) {
          map.set(item.category_id, {
            category_id: item.category_id,
            category_name: item.category_name,
            income: 0,
            expense: item.total,
            net: -item.total,
            count: item.count,
          })
        }
        for (const item of creditRes.breakdown) {
          const existing = map.get(item.category_id)
          if (existing) {
            existing.income = item.total
            existing.net = item.total - existing.expense
            existing.count += item.count
          } else {
            map.set(item.category_id, {
              category_id: item.category_id,
              category_name: item.category_name,
              income: item.total,
              expense: 0,
              net: item.total,
              count: item.count,
            })
          }
        }
        const merged = [...map.values()].sort(
          (a, b) => Math.abs(b.net) - Math.abs(a.net)
        )
        setNetItems(merged)
        setBreakdown([])
      } else {
        const data = await summaryApi.categoryBreakdown({ transaction_type: mode })
        setBreakdown(data.breakdown)
        setNetItems([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load breakdown')
    } finally {
      setLoading(false)
    }
  }, [mode])

  useEffect(() => {
    loadBreakdown()
  }, [loadBreakdown])

  const total = breakdown.reduce((sum, item) => sum + item.total, 0)
  const maxAbsNet = netItems.reduce((m, item) => Math.max(m, Math.abs(item.net)), 0)
  const netTotal = netItems.reduce((sum, item) => sum + item.net, 0)

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

  const isEmpty = mode === 'net' ? netItems.length === 0 : breakdown.length === 0

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Category Breakdown</h2>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('debit')}
            className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-sm rounded-lg ${
              mode === 'debit'
                ? 'bg-red-400 text-white shadow-sm'
                : 'bg-accent text-foreground/90 hover:bg-accent/80'
            }`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setMode('credit')}
            className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-sm rounded-lg ${
              mode === 'credit'
                ? 'bg-green-400 text-white shadow-sm'
                : 'bg-accent text-foreground/90 hover:bg-accent/80'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setMode('net')}
            className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-sm rounded-lg ${
              mode === 'net'
                ? 'bg-blue-400 text-white shadow-sm'
                : 'bg-accent text-foreground/90 hover:bg-accent/80'
            }`}
          >
            Net
          </button>
        </div>
      </div>

      {isEmpty ? (
        <p className="text-center text-muted-foreground py-8">
          {mode === 'debit' && 'No expenses found'}
          {mode === 'credit' && 'No income found'}
          {mode === 'net' && 'No category activity found'}
        </p>
      ) : mode === 'net' ? (
        <div className="space-y-3">
          {netItems.map((item) => {
            const isPositive = item.net >= 0
            const barWidth = maxAbsNet > 0 ? (Math.abs(item.net) / maxAbsNet) * 100 : 0
            const hasBoth = item.income > 0 && item.expense > 0

            return (
              <div key={item.category_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground truncate">
                    {item.category_name}
                  </span>
                  <span
                    className={`font-semibold tabular-nums whitespace-nowrap ${
                      isPositive ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {isPositive ? '+' : '−'}₹{formatINR2(Math.abs(item.net))}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isPositive ? 'bg-green-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {hasBoth ? (
                    <>
                      <span className="text-green-400">₹{formatINR2(item.income)} in</span>
                      <span className="mx-1.5">·</span>
                      <span className="text-red-400">₹{formatINR2(item.expense)} out</span>
                    </>
                  ) : (
                    <>
                      {item.count} transaction{item.count !== 1 ? 's' : ''}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
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
                    ₹{formatINR2(item.total)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        mode === 'debit' ? 'bg-red-400' : 'bg-green-400'
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

      {!isEmpty && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-foreground">Total</span>
            {mode === 'net' ? (
              <span className={netTotal >= 0 ? 'text-green-400' : 'text-red-400'}>
                {netTotal >= 0 ? '+' : '−'}₹{formatINR2(Math.abs(netTotal))}
              </span>
            ) : (
              <span className={mode === 'debit' ? 'text-red-400' : 'text-green-400'}>
                ₹{formatINR2(total)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
