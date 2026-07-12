"use client"

import { useState, useEffect } from 'react'
import { netWorthApi, type NetWorthEntry } from '@/lib/api/net-worth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatCompactINR } from '@/lib/utils'
import {
  chartAxisTick,
  chartAxisLine,
  chartGrid,
  chartTooltipContentStyle,
  chartTooltipLabelStyle,
} from '@/lib/chart-theme'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface NetWorthTrendProps {
  refreshTrigger?: number
}

export function NetWorthTrend({ refreshTrigger = 0 }: NetWorthTrendProps) {
  const [history, setHistory] = useState<NetWorthEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await netWorthApi.getHistory()
        // Sort by date ascending for chart
        setHistory((data || []).reverse())
      } catch {
        setHistory([])
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [refreshTrigger])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Net Worth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }
  if (history.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]" role="img" aria-label="Net worth trend line chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid {...chartGrid} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
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
                formatter={(value) => formatCurrency(value as number)}
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                contentStyle={chartTooltipContentStyle}
                labelStyle={chartTooltipLabelStyle}
              />
              {/* Glow underlay */}
              <Line
                type="monotone"
                dataKey="net_worth"
                stroke="var(--chart-1)"
                strokeWidth={6}
                strokeOpacity={0.25}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="net_worth"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--chart-1)', stroke: 'var(--background)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
