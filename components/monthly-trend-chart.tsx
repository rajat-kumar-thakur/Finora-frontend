"use client"

/**
 * Monthly Net Income Chart
 *
 * Dark-themed smooth area chart showing monthly net income trend
 */

import { useEffect, useMemo, useState } from 'react'
import { summaryApi, type MonthlySummary } from '@/lib/api'

interface MonthData extends MonthlySummary {
  label: string
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function MonthlyTrendChart() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const requests = Array.from({ length: 12 }, (_, idx) => summaryApi.monthly(year, idx + 1))
        const results = await Promise.all(requests)
        const withLabels: MonthData[] = results.map((m, idx) => ({ ...m, label: MONTH_LABELS[idx] }))
        setData(withLabels)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trend')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [year])

  const { maxValue, hasData, yAxisLabels } = useMemo(() => {
    if (!data.length) return { maxValue: 0, hasData: false, yAxisLabels: ['₹0'] }
    
    const maxNet = Math.max(...data.map(m => Math.abs(m.net)), 0)
    
    if (maxNet === 0) return { maxValue: 0, hasData: false, yAxisLabels: ['₹0'] }
    
    // Round to nice number
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxNet)))
    const rounded = Math.ceil(maxNet / magnitude) * magnitude
    
    const labels = []
    const steps = 4
    for (let i = 0; i <= steps; i++) {
      const value = (rounded / steps) * i
      if (value >= 100000) {
        labels.push(`₹${Math.round(value / 1000)}K`)
      } else if (value >= 1000) {
        labels.push(`₹${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`)
      } else {
        labels.push(`₹${Math.round(value)}`)
      }
    }
    
    return {
      maxValue: rounded,
      hasData: true,
      yAxisLabels: labels
    }
  }, [data])

  const formatValue = (value: number) => {
    const absValue = Math.abs(value)
    if (absValue >= 100000) {
      return `₹${Math.round(absValue / 1000)}K`
    } else if (absValue >= 1000) {
      return `₹${(absValue / 1000).toFixed(1)}K`
    } else {
      return `₹${Math.round(absValue)}`
    }
  }

  const getPointColor = (index: number, total: number) => {
    const ratio = index / (total - 1)
    if (ratio < 0.25) return '#3b82f6' // blue
    if (ratio < 0.5) return '#22c55e' // green
    if (ratio < 0.75) return '#f97316' // orange
    return '#ef4444' // red
  }

  const createSmoothPath = () => {
    if (!data.length || maxValue === 0) return ''
    
    const points = data.map((m, idx) => ({
      x: (idx / (data.length - 1)) * 100,
      y: 100 - ((m.net / maxValue) * 90 + 5)
    }))

    if (points.length < 2) return `M ${points[0].x} ${points[0].y}`

    let path = `M ${points[0].x} ${points[0].y}`
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      const controlPointX = (current.x + next.x) / 2
      
      path += ` Q ${controlPointX} ${current.y}, ${controlPointX} ${(current.y + next.y) / 2}`
      path += ` Q ${controlPointX} ${next.y}, ${next.x} ${next.y}`
    }
    
    return path
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Monthly Trend</h2>
          <p className="text-xs text-muted-foreground">Income vs expenses across the year</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-1.5 bg-accent text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          title="Select year"
        >
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {error && !loading && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!loading && !error && data.length > 0 && hasData && (
        <div className="relative bg-gray-900 rounded-xl p-6 border border-gray-800">
          {/* Chart Container */}
          <div className="relative" style={{ height: '320px' }}>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-400 pr-3">
              <div className="text-right">{yAxisLabels[4]}</div>
              <div className="text-right">{yAxisLabels[3]}</div>
              <div className="text-right">{yAxisLabels[2]}</div>
              <div className="text-right">{yAxisLabels[1]}</div>
              <div className="text-right">{yAxisLabels[0]}</div>
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-gray-500 font-medium">
                Monthly Net
              </div>
            </div>

            {/* Chart area */}
            <div className="absolute left-12 right-0 top-0 bottom-8">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(59,130,246,0.4)" />
                    <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <line
                    key={y}
                    x1={0}
                    x2={100}
                    y1={y}
                    y2={y}
                    stroke="rgba(148,163,184,0.1)"
                    strokeWidth="0.5"
                  />
                ))}

                {/* Area fill */}
                {maxValue > 0 && (
                  <path
                    d={`${createSmoothPath()} L 100 100 L 0 100 Z`}
                    fill="url(#areaGradient)"
                  />
                )}

                {/* Line */}
                {maxValue > 0 && (
                  <path
                    d={createSmoothPath()}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )}
              </svg>

              {/* Data points and labels */}
              <div className="absolute inset-0">
                {data.map((m, idx) => {
                  const x = (idx / (data.length - 1)) * 100
                  const y = 100 - ((m.net / maxValue) * 90 + 5)
                  return (
                    <div
                      key={idx}
                      className="absolute"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {/* Value label */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-300 whitespace-nowrap">
                        {formatValue(m.net)}
                      </div>
                      {/* Point */}
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: getPointColor(idx, data.length) }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="absolute left-12 right-0 bottom-0 flex justify-between text-xs text-gray-400">
              {data.map((m, idx) => (
                <div
                  key={idx}
                  className="rotate-45 origin-top-left translate-y-2"
                  style={{ width: '60px' }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && !error && data.length > 0 && !hasData && (
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground bg-gray-900 rounded-xl border border-gray-800">
          No income or expense data for this year yet.
        </div>
      )}
    </div>
  )
}
