"use client"

/**
 * Monthly Category Net Component
 *
 * Renders per-category net (income - expense) for a given month.
 * Sorted by absolute net descending so the biggest movers surface first.
 */

import { useState, useEffect, useCallback } from 'react'
import { summaryApi } from '@/lib/api'

interface Props {
  year: number
  month: number
}

interface Row {
  category_id: string
  category_name: string
  income: number
  expense: number
  net: number
  count: number
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatINR(amount: number): string {
  return amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function MonthlyCategoryNet({ year, month }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const lastDay = new Date(year, month, 0).getDate()
      const mm = String(month).padStart(2, '0')
      const start_date = `${year}-${mm}-01`
      const end_date = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`

      const [debitRes, creditRes] = await Promise.all([
        summaryApi.categoryBreakdown({ start_date, end_date, transaction_type: 'debit' }),
        summaryApi.categoryBreakdown({ start_date, end_date, transaction_type: 'credit' }),
      ])

      const map = new Map<string, Row>()

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

      setRows(merged)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load category net')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    load()
  }, [load])

  const maxAbsNet = rows.reduce((m, r) => Math.max(m, Math.abs(r.net)), 0)

  return (
    <div className="mt-4 sm:mt-6 pt-4 border-t border-border space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground">
          Net by Category
        </h3>
        {!loading && !error && rows.length > 0 && (
          <span className="text-[10px] sm:text-xs text-muted-foreground">
            {rows.length} categor{rows.length !== 1 ? 'ies' : 'y'}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="text-center text-muted-foreground py-4 text-sm">
          No category activity in {MONTH_NAMES[month - 1]} {year}
        </p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row) => {
            const isPositive = row.net >= 0
            const barWidth = maxAbsNet > 0 ? (Math.abs(row.net) / maxAbsNet) * 100 : 0
            const hasBoth = row.income > 0 && row.expense > 0

            return (
              <div key={row.category_id} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground truncate">
                    {row.category_name}
                  </span>
                  <span
                    className={`font-semibold tabular-nums whitespace-nowrap ${
                      isPositive ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {isPositive ? '+' : '-'}₹{formatINR(Math.abs(row.net))}
                  </span>
                </div>

                <div className="flex-1 bg-border rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isPositive ? 'bg-green-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <div className="text-[11px] sm:text-xs text-muted-foreground">
                  {hasBoth ? (
                    <>
                      <span className="text-green-400">₹{formatINR(row.income)} in</span>
                      <span className="mx-1.5">·</span>
                      <span className="text-red-400">₹{formatINR(row.expense)} out</span>
                    </>
                  ) : (
                    <>
                      {row.count} transaction{row.count !== 1 ? 's' : ''}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
