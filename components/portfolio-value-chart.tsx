"use client"

import { useState, useEffect, useMemo } from 'react'
import {
  investmentApi,
  type PortfolioPerformance,
  type TimePeriod
} from '@/lib/api/investments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatCompactINR } from '@/lib/utils'
import { chartAxisTick, chartAxisLine, chartCursor } from '@/lib/chart-theme'
import { Camera, ChartArea } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

interface PortfolioValueChartProps {
  refreshTrigger?: number
  onSnapshotCreated?: () => void
}

const TIME_PERIODS: { label: string; value: TimePeriod }[] = [
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '1Y', value: '1Y' },
  { label: 'ALL', value: 'ALL' },
]

export function PortfolioValueChart({ refreshTrigger = 0, onSnapshotCreated }: PortfolioValueChartProps) {
  const [performance, setPerformance] = useState<PortfolioPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M')
  const [creatingSnapshot, setCreatingSnapshot] = useState(false)
  const [localRefresh, setLocalRefresh] = useState(0)

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const data = await investmentApi.getHistory(selectedPeriod)
        setPerformance(data)
      } catch {
        setPerformance(null)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [selectedPeriod, refreshTrigger, localRefresh])

  const handleCreateSnapshot = async () => {
    setCreatingSnapshot(true)
    try {
      await investmentApi.createSnapshot()
      setLocalRefresh(prev => prev + 1)
      onSnapshotCreated?.()
    } catch (error) {
      console.error('Failed to create snapshot:', error)
    } finally {
      setCreatingSnapshot(false)
    }
  }

  // Directional series color (money up = mint, down = coral)
  const chartColor = useMemo(() => {
    if (!performance) return 'var(--chart-1)'
    return performance.is_positive ? 'var(--positive)' : 'var(--negative)'
  }, [performance])

  // Gradient ID for area fill
  const gradientId = `portfolioGradient-${performance?.is_positive ? 'positive' : 'negative'}`

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!performance || performance.history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={ChartArea}
            title="No portfolio history yet"
            body="Create a snapshot to start tracking your portfolio value over time."
          >
            <Button
              type="button"
              onClick={handleCreateSnapshot}
              disabled={creatingSnapshot}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              {creatingSnapshot ? 'Creating...' : 'Create Snapshot'}
            </Button>
          </EmptyState>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium">Portfolio Value</CardTitle>
          <div className="flex items-baseline gap-2">
            <span className="font-numeric text-2xl font-bold">
              {formatCurrency(performance.current_value)}
            </span>
            <span
              className={`font-numeric text-sm font-medium ${
                performance.is_positive ? 'text-positive' : 'text-negative'
              }`}
            >
              {performance.is_positive ? '+' : ''}
              {formatCurrency(performance.absolute_change)}
              {' '}
              ({performance.is_positive ? '+' : ''}
              {performance.percentage_change.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Period Selector */}
          <div className="flex gap-1 bg-surface-raised border border-border rounded-md p-0.5">
            {TIME_PERIODS.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                aria-pressed={selectedPeriod === period.value}
                className={`px-3 py-1 text-sm font-medium rounded-sm transition-colors ${
                  selectedPeriod === period.value
                    ? 'bg-background text-foreground shadow-[0_0_0_1px_var(--border)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Snapshot Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCreateSnapshot}
            disabled={creatingSnapshot}
            className="gap-1.5"
          >
            <Camera className="h-3.5 w-3.5" />
            {creatingSnapshot ? 'Saving...' : 'Snapshot'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px]" role="img" aria-label="Portfolio value over time area chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={performance.history}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.35} />
                  <stop offset="55%" stopColor={chartColor} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  const d = new Date(date)
                  if (selectedPeriod === '1D') {
                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
                }}
                tick={chartAxisTick}
                axisLine={chartAxisLine}
                tickLine={false}
              />

              <YAxis
                tickFormatter={(value) => formatCompactINR(value as number)}
                tick={chartAxisTick}
                axisLine={false}
                tickLine={false}
                width={56}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={chartCursor}
              />

              {/* Reference line at start value */}
              <ReferenceLine
                y={performance.start_value}
                stroke="var(--muted-foreground)"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />

              {/* Glow underlay (SVG-only, out of tooltip payload) */}
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={6}
                strokeOpacity={0.25}
                fill="none"
                dot={false}
                activeDot={false}
                tooltipType="none"
                isAnimationActive={false}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: chartColor,
                  stroke: 'var(--background)',
                  strokeWidth: 2
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ payload: { value: number; return: number; return_percentage: number } }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  const date = new Date(label || '')

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">
        {date.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </p>
      <p className="font-numeric text-lg font-bold">
        {formatCurrency(data.value)}
      </p>
      <p className={`font-numeric text-sm ${data.return >= 0 ? 'text-positive' : 'text-negative'}`}>
        {data.return >= 0 ? '+' : ''}{formatCurrency(data.return)}
        {' '}({data.return_percentage.toFixed(2)}%)
      </p>
    </div>
  )
}
