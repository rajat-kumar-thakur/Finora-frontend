"use client"

import { useState, useEffect } from 'react'
import { netWorthApi, type NetWorthEntry } from '@/lib/api/net-worth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
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
      } catch (error) {
        console.error('Failed to fetch net worth history:', error)
        setHistory([])
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [refreshTrigger])

  if (loading) return <div>Loading trend...</div>
  if (history.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis 
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value as number)}
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="net_worth" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
