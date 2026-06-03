"use client"

/**
 * Month Comparison Component
 *
 * Compares the selected month's income/expense/net against the previous month.
 * Shows direction (up/down) with sign-aware coloring (e.g. higher expenses = bad/red).
 */

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { summaryApi, type MonthlySummary } from '@/lib/api'

interface Props {
  year: number
  month: number
  currentSummary: MonthlySummary
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatINR(amount: number): string {
  return amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function MonthComparison({ year, month, currentSummary }: Props) {
  const [prevSummary, setPrevSummary] = useState<MonthlySummary | null>(null)
  const [loading, setLoading] = useState(true)

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevMonthName = MONTH_NAMES[prevMonth - 1]

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await summaryApi.monthly(prevYear, prevMonth)
      setPrevSummary(data)
    } catch {
      setPrevSummary(null)
    } finally {
      setLoading(false)
    }
  }, [prevYear, prevMonth])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="mt-4 sm:mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (!prevSummary) {
    return null
  }

  const items = [
    {
      label: 'Income',
      current: currentSummary.total_income,
      previous: prevSummary.total_income,
      moreIsBetter: true,
    },
    {
      label: 'Expenses',
      current: currentSummary.total_expenses,
      previous: prevSummary.total_expenses,
      moreIsBetter: false,
    },
    {
      label: 'Invested',
      current: currentSummary.total_invested,
      previous: prevSummary.total_invested,
      moreIsBetter: true,
    },
    {
      label: 'Net',
      current: currentSummary.net,
      previous: prevSummary.net,
      moreIsBetter: true,
    },
  ]

  return (
    <div className="mt-4 sm:mt-6 pt-4 border-t border-border space-y-3">
      <h3 className="text-xs sm:text-sm font-semibold text-foreground">
        vs {prevMonthName} {prevYear}
      </h3>

      <div className="space-y-2">
        {items.map(({ label, current, previous, moreIsBetter }) => {
          const delta = current - previous
          const pct = previous !== 0 ? (delta / Math.abs(previous)) * 100 : 0
          const isUp = delta > 0
          const isDown = delta < 0
          const isNeutral = delta === 0
          const isGood = isNeutral ? null : moreIsBetter ? isUp : isDown

          const colorClass = isNeutral
            ? 'text-muted-foreground'
            : isGood
              ? 'text-green-500'
              : 'text-red-500'

          const Icon = isNeutral ? Minus : isUp ? TrendingUp : TrendingDown

          return (
            <div
              key={label}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-medium text-foreground">{label}</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  Last: ₹{formatINR(previous)}
                </span>
              </div>
              <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold ${colorClass}`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="tabular-nums whitespace-nowrap">
                  {isUp ? '+' : isDown ? '−' : ''}₹{formatINR(Math.abs(delta))}
                </span>
                {previous !== 0 && (
                  <span className="text-[10px] sm:text-xs opacity-80 tabular-nums">
                    ({isUp ? '+' : isDown ? '−' : ''}{Math.abs(pct).toFixed(0)}%)
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
