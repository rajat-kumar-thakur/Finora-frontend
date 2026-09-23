"use client"

/**
 * Category Breakdown Component
 *
 * Shows spending or earning by category, or net (income − expense) per category,
 * each with the change vs the previous period (none for All Time).
 */

import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChartPie } from 'lucide-react'
import { summaryApi, type CategoryBreakdownItem } from '@/lib/api'
import { CategoryTransactionsInline } from '@/components/category-transactions-inline'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { DeltaBadge } from '@/components/ui/delta-badge'
import { previousRange, todayIST } from '@/lib/periods'

type Mode = 'debit' | 'credit' | 'net' | 'investments'

// 0 sentinel = "All months of the chosen year"; year=0 sentinel = "All Time"
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const FIRST_YEAR = 2024

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
  prevIncome: number
  prevExpense: number
  prevNet: number
  prevCount: number
}

function formatINR2(amount: number): string {
  return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function CategoryBreakdown() {
  const today = useMemo(() => todayIST(), [])
  const [mode, setMode] = useState<Mode>('debit')
  const [selectedYear, setSelectedYear] = useState<number>(today.year)
  const [selectedMonth, setSelectedMonth] = useState<number>(today.month)
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([])
  const [netItems, setNetItems] = useState<NetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const comparison = useMemo(
    () => previousRange(selectedYear, selectedMonth, today),
    [selectedYear, selectedMonth, today]
  )

  useEffect(() => {
    // Period switches fire overlapping requests; only the latest may land.
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      const range = buildDateRange(selectedYear, selectedMonth)
      // Only defined keys — the API client stringifies undefined as "undefined".
      const compare = comparison
        ? { compare_start_date: comparison.start_date, compare_end_date: comparison.end_date }
        : {}

      try {
        if (mode === 'net') {
          // Net includes investments as outflow, so the net total matches the
          // monthly summary's Net (income − expenses − invested).
          const [debitRes, creditRes] = await Promise.all([
            summaryApi.categoryBreakdown({ transaction_type: 'debit', investments: 'include', ...range, ...compare }),
            summaryApi.categoryBreakdown({ transaction_type: 'credit', investments: 'include', ...range, ...compare }),
          ])
          if (cancelled) return

          const map = new Map<string, NetItem>()
          const entry = (item: CategoryBreakdownItem): NetItem => {
            let existing = map.get(item.category_id)
            if (!existing) {
              existing = {
                category_id: item.category_id,
                category_name: item.category_name,
                income: 0, expense: 0, net: 0, count: 0,
                prevIncome: 0, prevExpense: 0, prevNet: 0, prevCount: 0,
              }
              map.set(item.category_id, existing)
            }
            return existing
          }
          for (const item of debitRes.breakdown) {
            const e = entry(item)
            e.expense = item.total
            e.prevExpense = item.previous_total ?? 0
            e.count += item.count
            e.prevCount += item.previous_count ?? 0
          }
          for (const item of creditRes.breakdown) {
            const e = entry(item)
            e.income = item.total
            e.prevIncome = item.previous_total ?? 0
            e.count += item.count
            e.prevCount += item.previous_count ?? 0
          }
          for (const e of map.values()) {
            e.net = e.income - e.expense
            e.prevNet = e.prevIncome - e.prevExpense
          }
          // Current-period activity first (by |net|), previous-only rows after.
          const merged = [...map.values()].sort(
            (a, b) =>
              Number(b.count > 0) - Number(a.count > 0) ||
              Math.abs(b.net) - Math.abs(a.net) ||
              Math.abs(b.prevNet) - Math.abs(a.prevNet)
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
            ...compare,
          })
          if (cancelled) return
          setBreakdown(data.breakdown)
          setNetItems([])
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load breakdown')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [mode, selectedYear, selectedMonth, comparison])

  // Collapse any open drill-down when the view (mode/period) changes.
  useEffect(() => {
    setExpandedId(null)
  }, [mode, selectedYear, selectedMonth])

  const total = breakdown.reduce((sum, item) => sum + item.total, 0)
  const prevTotal = breakdown.reduce((sum, item) => sum + (item.previous_total ?? 0), 0)
  const maxAbsNet = netItems.reduce((m, item) => Math.max(m, Math.abs(item.net)), 0)
  const netTotal = netItems.reduce((sum, item) => sum + item.net, 0)
  const prevNetTotal = netItems.reduce((sum, item) => sum + item.prevNet, 0)

  const years = Array.from({ length: today.year - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i)
  // Spending up is bad; income, investing and net up are good.
  const moreIsBetter = mode !== 'debit'

  if (loading) {
    return (
      <div className="card-base card-padding space-y-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="alert-error">{error}</div>
  }

  // Rows with no current-period transactions exist only for the comparison
  // (they were active in the previous period); they don't count as data.
  const isEmpty = mode === 'net'
    ? netItems.every((item) => item.count === 0)
    : breakdown.every((item) => item.count === 0)

  // Drill-down filters: freeze the active period and derive the transaction type
  // from the mode (net shows both legs).
  const range = buildDateRange(selectedYear, selectedMonth)
  const drilldownType: 'debit' | 'credit' | undefined =
    mode === 'credit' ? 'credit' : mode === 'net' ? undefined : 'debit'

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Category Breakdown</h2>
            {comparison && (
              <p className="text-xs text-muted-foreground mt-0.5">Change {comparison.label}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              disabled={selectedYear === 0}
              className="px-2 sm:px-3 py-2 sm:py-1.5 bg-card text-foreground border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring/25 focus:border-ring disabled:opacity-50"
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
              className="px-2 sm:px-3 py-2 sm:py-1.5 bg-card text-foreground border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring/25 focus:border-ring"
              title="Year"
            >
              <option value={0}>All Time</option>
              {years.map((y) => (
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
                ? 'bg-negative/15 text-negative border border-negative/30 font-medium'
                : 'bg-accent text-foreground/90 hover:bg-accent/80 border border-transparent'
            }`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setMode('credit')}
            className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-sm rounded-lg ${
              mode === 'credit'
                ? 'bg-positive/15 text-positive border border-positive/30 font-medium'
                : 'bg-accent text-foreground/90 hover:bg-accent/80 border border-transparent'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setMode('investments')}
            className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-sm rounded-lg ${
              mode === 'investments'
                ? 'bg-chart-3/15 text-chart-3 border border-chart-3/30 font-medium'
                : 'bg-accent text-foreground/90 hover:bg-accent/80 border border-transparent'
            }`}
          >
            Investments
          </button>
          <button
            type="button"
            onClick={() => setMode('net')}
            className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-sm rounded-lg ${
              mode === 'net'
                ? 'bg-primary/15 text-primary border border-primary/30 font-medium'
                : 'bg-accent text-foreground/90 hover:bg-accent/80 border border-transparent'
            }`}
          >
            Net
          </button>
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={ChartPie}
          title={
            mode === 'debit' ? 'No expenses found'
              : mode === 'credit' ? 'No income found'
              : mode === 'investments' ? 'No investments found'
              : 'No category activity found'
          }
          body={
            selectedYear !== 0
              ? `for ${selectedMonth === 0 ? selectedYear : `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}`
              : undefined
          }
        />
      ) : mode === 'net' ? (
        <div className="space-y-3">
          {netItems.map((item) => {
            const isPreviousOnly = item.count === 0
            const isPositive = item.net >= 0
            const barWidth = maxAbsNet > 0 ? (Math.abs(item.net) / maxAbsNet) * 100 : 0
            const hasBoth = item.income > 0 && item.expense > 0
            const isOpen = !isPreviousOnly && expandedId === item.category_id

            return (
              <div key={item.category_id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : item.category_id)}
                  disabled={isPreviousOnly}
                  aria-expanded={isOpen}
                  className="w-full text-left space-y-1 rounded-md -mx-1 px-1 py-1 enabled:hover:bg-accent/40 transition-colors disabled:cursor-default"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`flex items-center gap-1.5 font-medium min-w-0 ${
                        isPreviousOnly ? 'text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                          isOpen ? '' : '-rotate-90'
                        } ${isPreviousOnly ? 'invisible' : ''}`}
                      />
                      <span className="truncate">{item.category_name}</span>
                    </span>
                    {isPreviousOnly ? (
                      <span className="font-numeric text-muted-foreground whitespace-nowrap">₹0.00</span>
                    ) : (
                      <span
                        className={`font-numeric font-semibold whitespace-nowrap ${
                          isPositive ? 'text-positive' : 'text-negative'
                        }`}
                      >
                        {isPositive ? '+' : '−'}₹{formatINR2(Math.abs(item.net))}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isPositive ? 'bg-positive' : 'bg-negative'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="min-w-0 truncate">
                      {isPreviousOnly ? (
                        'none this period'
                      ) : hasBoth ? (
                        <>
                          <span className="text-positive font-numeric">₹{formatINR2(item.income)} in</span>
                          <span className="mx-1.5">·</span>
                          <span className="text-negative font-numeric">₹{formatINR2(item.expense)} out</span>
                        </>
                      ) : (
                        <>
                          {item.count} transaction{item.count !== 1 ? 's' : ''}
                        </>
                      )}
                    </span>
                    {comparison && (
                      <DeltaBadge
                        current={item.net}
                        previous={item.prevNet}
                        hadPrevious={item.prevCount > 0}
                        moreIsBetter
                      />
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
            const isPreviousOnly = item.count === 0
            const percentage = total > 0 ? (item.total / total) * 100 : 0
            const isOpen = !isPreviousOnly && expandedId === item.category_id

            return (
              <div key={item.category_id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : item.category_id)}
                  disabled={isPreviousOnly}
                  aria-expanded={isOpen}
                  className="w-full text-left space-y-1 rounded-md -mx-1 px-1 py-1 enabled:hover:bg-accent/40 transition-colors disabled:cursor-default"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`flex items-center gap-1.5 font-medium min-w-0 ${
                        isPreviousOnly ? 'text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                          isOpen ? '' : '-rotate-90'
                        } ${isPreviousOnly ? 'invisible' : ''}`}
                      />
                      <span className="truncate">{item.category_name}</span>
                    </span>
                    <span className="text-muted-foreground font-numeric">
                      ₹{formatINR2(item.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          mode === 'debit'
                            ? 'bg-negative'
                            : mode === 'investments'
                              ? 'bg-chart-3'
                              : 'bg-positive'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right font-numeric">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {isPreviousOnly
                        ? 'none this period'
                        : `${item.count} transaction${item.count !== 1 ? 's' : ''}`}
                    </span>
                    {comparison && (
                      <DeltaBadge
                        current={item.total}
                        previous={item.previous_total ?? 0}
                        hadPrevious={(item.previous_count ?? 0) > 0}
                        moreIsBetter={moreIsBetter}
                      />
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
      )}

      {!isEmpty && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between gap-2 text-sm font-semibold">
            <span className="text-foreground">Total</span>
            <span className="flex items-center gap-3">
              {comparison && (
                <DeltaBadge
                  current={mode === 'net' ? netTotal : total}
                  previous={mode === 'net' ? prevNetTotal : prevTotal}
                  moreIsBetter={moreIsBetter}
                />
              )}
              {mode === 'net' ? (
                <span className={`font-numeric ${netTotal >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {netTotal >= 0 ? '+' : '−'}₹{formatINR2(Math.abs(netTotal))}
                </span>
              ) : (
                <span className={`font-numeric ${
                  mode === 'debit'
                    ? 'text-negative'
                    : mode === 'investments'
                      ? 'text-chart-3'
                      : 'text-positive'
                }`}>
                  ₹{formatINR2(total)}
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
