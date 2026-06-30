"use client"

/**
 * Category Breakdown Component
 *
 * Shows spending or earning by category, or net (income − expense) per category.
 */

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import { summaryApi, type CategoryBreakdownItem } from '@/lib/api'
import { CategoryTransactionsInline } from '@/components/category-transactions-inline'

type Mode = 'debit' | 'credit' | 'net' | 'investments'

// 0 sentinel = "All months of the chosen year"; year=0 sentinel = "All Time"
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function lastDayOfMonth(year: number, month: number): number {
  // month is 1-indexed
  return new Date(year, month, 0).getDate()
}

function buildDateRange(year: number, month: number): { start_date?: string; end_date?: string } {
  if (year === 0) return {} // All Time
  if (month === 0) {
    // Whole year
    return {
      start_date: `${year}-01-01T00:00:00`,
      end_date: `${year}-12-31T23:59:59`,
    }
  }
  const mm = String(month).padStart(2, '0')
  const lastDay = String(lastDayOfMonth(year, month)).padStart(2, '0')
  return {
    start_date: `${year}-${mm}-01T00:00:00`,
    end_date: `${year}-${mm}-${lastDay}T23:59:59`,
  }
}

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
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1)
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([])
  const [netItems, setNetItems] = useState<NetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadBreakdown = useCallback(async () => {
    setLoading(true)
    setError(null)

    const range = buildDateRange(selectedYear, selectedMonth)

    try {
      if (mode === 'net') {
        // Net includes investments as outflow, so the net total matches the
        // monthly summary's Net (income − expenses − invested).
        const [debitRes, creditRes] = await Promise.all([
          summaryApi.categoryBreakdown({ transaction_type: 'debit', investments: 'include', ...range }),
          summaryApi.categoryBreakdown({ transaction_type: 'credit', investments: 'include', ...range }),
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
        // 'investments' = debits in investment categories only; 'debit'/'credit'
        // exclude investment categories (pure spending / income).
        const data = await summaryApi.categoryBreakdown({
          transaction_type: mode === 'investments' ? 'debit' : mode,
          investments: mode === 'investments' ? 'only' : 'exclude',
          ...range,
        })
        setBreakdown(data.breakdown)
        setNetItems([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load breakdown')
    } finally {
      setLoading(false)
    }
  }, [mode, selectedYear, selectedMonth])

  useEffect(() => {
    loadBreakdown()
  }, [loadBreakdown])

  // Collapse any open drill-down when the view (mode/period) changes.
  useEffect(() => {
    setExpandedId(null)
  }, [mode, selectedYear, selectedMonth])

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

  // Drill-down filters: freeze the active period and derive the transaction type
  // from the mode (net shows both legs).
  const range = buildDateRange(selectedYear, selectedMonth)
  const drilldownType: 'debit' | 'credit' | undefined =
    mode === 'credit' ? 'credit' : mode === 'net' ? undefined : 'debit'

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Category Breakdown</h2>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              disabled={selectedYear === 0}
              className="px-2 sm:px-3 py-2 sm:py-1.5 bg-accent text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              title="Month"
            >
              <option value={0}>All Months</option>
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx + 1}>{name}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2 sm:px-3 py-2 sm:py-1.5 bg-accent text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              title="Year"
            >
              <option value={0}>All Time</option>
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

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
            onClick={() => setMode('investments')}
            className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-sm rounded-lg ${
              mode === 'investments'
                ? 'bg-indigo-400 text-white shadow-sm'
                : 'bg-accent text-foreground/90 hover:bg-accent/80'
            }`}
          >
            Investments
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
          {mode === 'investments' && 'No investments found'}
          {mode === 'net' && 'No category activity found'}
          {selectedYear !== 0 && (
            <span className="block text-xs mt-1">
              for {selectedMonth === 0 ? selectedYear : `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
            </span>
          )}
        </p>
      ) : mode === 'net' ? (
        <div className="space-y-3">
          {netItems.map((item) => {
            const isPositive = item.net >= 0
            const barWidth = maxAbsNet > 0 ? (Math.abs(item.net) / maxAbsNet) * 100 : 0
            const hasBoth = item.income > 0 && item.expense > 0
            const isOpen = expandedId === item.category_id

            return (
              <div key={item.category_id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : item.category_id)}
                  aria-expanded={isOpen}
                  className="w-full text-left space-y-1 rounded-md -mx-1 px-1 py-1 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-foreground min-w-0">
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                          isOpen ? '' : '-rotate-90'
                        }`}
                      />
                      <span className="truncate">{item.category_name}</span>
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
                </button>

                {isOpen && (
                  <CategoryTransactionsInline
                    categoryId={item.category_id}
                    filters={{ ...range, transaction_type: drilldownType }}
                  />
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {breakdown.map((item) => {
            const percentage = total > 0 ? (item.total / total) * 100 : 0
            const isOpen = expandedId === item.category_id

            return (
              <div key={item.category_id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : item.category_id)}
                  aria-expanded={isOpen}
                  className="w-full text-left space-y-1 rounded-md -mx-1 px-1 py-1 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-foreground min-w-0">
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                          isOpen ? '' : '-rotate-90'
                        }`}
                      />
                      <span className="truncate">{item.category_name}</span>
                    </span>
                    <span className="text-muted-foreground">
                      ₹{formatINR2(item.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          mode === 'debit'
                            ? 'bg-red-400'
                            : mode === 'investments'
                              ? 'bg-indigo-400'
                              : 'bg-green-400'
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
                </button>

                {isOpen && (
                  <CategoryTransactionsInline
                    categoryId={item.category_id}
                    filters={{ ...range, transaction_type: drilldownType }}
                  />
                )}
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
              <span className={
                mode === 'debit'
                  ? 'text-red-400'
                  : mode === 'investments'
                    ? 'text-indigo-400'
                    : 'text-green-400'
              }>
                ₹{formatINR2(total)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
