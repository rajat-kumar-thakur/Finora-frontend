"use client"

/**
 * Monthly Summary Component
 * 
 * Displays monthly income/expense summary.
 */

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { summaryApi, type MonthlySummary } from '@/lib/api'
import { MonthComparison } from './month-comparison'
import { AccountSelector } from '@/components/account-selector'
import { Skeleton } from '@/components/ui/skeleton'

interface MonthlySummaryCardProps {
  refreshTrigger?: number
}

export function MonthlySummaryCard({ refreshTrigger }: MonthlySummaryCardProps = {}) {
  const [summary, setSummary] = useState<MonthlySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  // "" sentinel = All Accounts (cumulative)
  const [selectedAccount, setSelectedAccount] = useState<string>("")

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await summaryApi.monthly(
        selectedYear,
        selectedMonth,
        selectedAccount || undefined
      )
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary')
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedMonth, selectedAccount])

  useEffect(() => {
    loadSummary()
  }, [loadSummary, refreshTrigger])

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  if (loading) {
    return (
      <div className="card-base p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4">
          <Skeleton className="h-5 w-40" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert-error">
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="card-base p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4">
        <h2 className="text-sm sm:text-base font-semibold text-foreground">Monthly Summary</h2>

        <div className="flex flex-wrap gap-2">
          <AccountSelector
            id="monthly-summary-account"
            value={selectedAccount}
            onChange={setSelectedAccount}
            includeAllOption
            className="min-w-[140px]"
          />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="h-9 px-3 bg-card border border-border rounded-md text-xs font-medium text-foreground"
            title="Select month"
          >
            {months.map((month, idx) => (
              <option key={idx} value={idx + 1}>
                {month}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-9 px-3 bg-card border border-border rounded-md text-xs font-medium text-foreground"
            title="Select year"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {/* Income */}
          <div className="bg-positive/5 border border-positive/20 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-positive font-medium">
              <TrendingUp className="h-3 w-3" />
              Income
            </div>
            <div className="text-sm sm:text-lg font-bold text-positive mt-0.5 sm:mt-1 truncate font-numeric">
              ₹{summary.total_income.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
              {summary.income_count} transaction{summary.income_count !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-negative/5 border border-negative/20 rounded-lg p-2 sm:p-3">
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-negative font-medium">
              <TrendingDown className="h-3 w-3" />
              Expenses
            </div>
            <div className="text-sm sm:text-lg font-bold text-negative mt-0.5 sm:mt-1 truncate font-numeric">
              ₹{summary.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
              {summary.expense_count} transaction{summary.expense_count !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Invested (MF + FD) — capital allocation, not counted as expense */}
          <div className="bg-chart-3/5 border border-chart-3/20 rounded-lg p-2 sm:p-3">
            <div className="text-[11px] sm:text-xs text-chart-3 font-medium">Invested</div>
            <div className="text-sm sm:text-lg font-bold text-chart-3 mt-0.5 sm:mt-1 truncate font-numeric">
              ₹{summary.total_invested.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
              MF + FD
            </div>
          </div>

          {/* Net */}
          <div className={`border rounded-lg p-2 sm:p-3 ${
            summary.net >= 0
              ? 'bg-positive/5 border-positive/20'
              : 'bg-warning/5 border-warning/20'
          }`}>
            <div className={`text-[11px] sm:text-xs font-medium ${
              summary.net >= 0 ? 'text-positive' : 'text-warning'
            }`}>
              Net
            </div>
            <div className={`text-sm sm:text-lg font-bold mt-0.5 sm:mt-1 truncate font-numeric ${
              summary.net >= 0 ? 'text-positive' : 'text-warning'
            }`}>
              ₹{summary.net.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className={`text-[11px] sm:text-xs mt-0.5 hidden sm:block ${
              summary.net >= 0 ? 'text-muted-foreground' : 'text-muted-foreground'
            }`}>
              {summary.net >= 0 ? 'Surplus' : 'Deficit'}
            </div>
          </div>
        </div>
      )}

      {summary && (
        <MonthComparison
          year={selectedYear}
          month={selectedMonth}
          currentSummary={summary}
        />
      )}
    </div>
  )
}
