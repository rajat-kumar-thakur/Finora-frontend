"use client"

/**
 * Monthly Summary Component
 * 
 * Displays monthly income/expense summary.
 */

import { useState, useEffect } from 'react'
import { summaryApi, type MonthlySummary } from '@/lib/api'

interface MonthlySummaryCardProps {
  refreshTrigger?: number
}

export function MonthlySummaryCard({ refreshTrigger }: MonthlySummaryCardProps = {}) {
  const [summary, setSummary] = useState<MonthlySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    loadSummary()
  }, [selectedYear, selectedMonth, refreshTrigger])

  const loadSummary = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await summaryApi.monthly(selectedYear, selectedMonth)
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary')
    } finally {
      setLoading(false)
    }
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4 pr-2">
        <h2 className="text-base font-semibold text-foreground">Monthly Summary</h2>

        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 bg-accent text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {months.map((month, idx) => (
              <option key={idx} value={idx + 1}>{month}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 bg-accent text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3">
          {/* Income */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="text-xs text-green-400 font-medium">Total Income</div>
            <div className="text-lg font-bold text-green-500 mt-1">
              ₹{summary.total_income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {summary.income_count} transaction{summary.income_count !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="text-xs text-red-400 font-medium">Total Expenses</div>
            <div className="text-lg font-bold text-red-500 mt-1">
              ₹{summary.total_expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {summary.expense_count} transaction{summary.expense_count !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Net */}
          <div className={`border rounded-lg p-3 ${
            summary.net >= 0 
              ? 'bg-blue-500/10 border-blue-500/20' 
              : 'bg-orange-500/10 border-orange-500/20'
          }`}>
            <div className={`text-xs font-medium ${
              summary.net >= 0 ? 'text-blue-400' : 'text-orange-400'
            }`}>
              Net Balance
            </div>
            <div className={`text-lg font-bold mt-1 ${
              summary.net >= 0 ? 'text-blue-500' : 'text-orange-500'
            }`}>
              ₹{summary.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className={`text-xs mt-0.5 ${
              summary.net >= 0 ? 'text-muted-foreground' : 'text-muted-foreground'
            }`}>
              {summary.net >= 0 ? 'Surplus' : 'Deficit'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
