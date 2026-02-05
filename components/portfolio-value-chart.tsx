"use client"

import { useState, useEffect, useMemo } from 'react'
import {
  investmentApi,
  type PortfolioPerformance,
  type TimePeriod
} from '@/lib/api/investments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Camera } from 'lucide-react'
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

  // Determine chart color based on performance
  const chartColor = useMemo(() => {
    if (!performance) return 'hsl(var(--primary))'
    return performance.is_positive ? '#22c55e' : '#ef4444' // green-500 / red-500
  }, [performance])

  // Gradient ID for area fill
  const gradientId = `portfolioGradient-${performance?.is_positive ? 'positive' : 'negative'}`

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <div className="animate-pulse text-muted-foreground">Loading chart...</div>
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
        <CardContent className="flex flex-col items-center justify-center h-[300px] text-center">
          <p className="text-muted-foreground">
            No portfolio history available yet.
          </p>
          <p className="text-sm text-muted-foreground mt-2 mb-4">
            Create a snapshot to start tracking your portfolio value over time.
          </p>
          <Button
            type="button"
            onClick={handleCreateSnapshot}
            disabled={creatingSnapshot}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            {creatingSnapshot ? 'Creating...' : 'Create Snapshot'}
          </Button>
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
            <span className="text-2xl font-bold">
              {formatCurrency(performance.current_value)}
            </span>
            <span
              className={`text-sm font-medium ${
                performance.is_positive ? 'text-green-500' : 'text-red-500'
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
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {TIME_PERIODS.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === period.value
                    ? 'bg-background text-foreground shadow-sm'
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
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={performance.history}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartColor}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartColor}
                    stopOpacity={0}
                  />
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
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />

              <YAxis
                tickFormatter={(value) => {
                  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`
                  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
                  return value.toString()
                }}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '3 3' }}
              />

              {/* Reference line at start value */}
              <ReferenceLine
                y={performance.start_value}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
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
                  stroke: 'hsl(var(--background))',
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
      <p className="text-sm text-muted-foreground mb-1">
        {date.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </p>
      <p className="text-lg font-bold">
        {formatCurrency(data.value)}
      </p>
      <p className={`text-sm ${data.return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {data.return >= 0 ? '+' : ''}{formatCurrency(data.return)}
        {' '}({data.return_percentage.toFixed(2)}%)
      </p>
    </div>
  )
}
