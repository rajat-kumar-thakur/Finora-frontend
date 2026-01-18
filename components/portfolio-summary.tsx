"use client"

import { useState, useEffect } from 'react'
import { investmentApi, type PortfolioSummary, type TypeReturns } from '@/lib/api/investments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface PortfolioSummaryProps {
  refreshTrigger: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export function PortfolioSummaryView({ refreshTrigger }: PortfolioSummaryProps) {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await investmentApi.getSummary()
        setSummary(data)
      } catch (error) {
        console.error('Failed to fetch portfolio summary:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [refreshTrigger])

  if (loading) return <div>Loading summary...</div>
  if (!summary || summary.total_value === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">No investments yet. Add your first investment to see your portfolio summary.</p>
        </CardContent>
      </Card>
    )
  }

  const allocationData = Object.entries(summary.allocation).map(([name, value]) => ({
    name,
    value
  }))

  return (
    <div className="space-y-4">
      {/* Portfolio Performance and Asset Allocation */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.total_value)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Return</p>
                <p className={`text-2xl font-bold ${summary.total_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.total_return)}
                  <span className="text-sm ml-2 font-normal">
                    ({summary.return_percentage.toFixed(2)}%)
                  </span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-xl">{formatCurrency(summary.total_cost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Separate Returns by Type */}
      {summary.returns_by_type && (
        <div className="grid gap-4 md:grid-cols-2">
          <ReturnCard
            title="Stocks Returns"
            data={summary.returns_by_type['Stock']}
          />
          <ReturnCard
            title="Mutual Funds Returns"
            data={summary.returns_by_type['Mutual Fund']}
          />
        </div>
      )}
    </div>
  )
}

function ReturnCard({ title, data }: { title: string; data?: TypeReturns }) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No investments</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Value</p>
            <p className="text-lg font-semibold">{formatCurrency(data.value)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Cost</p>
            <p className="text-lg font-semibold">{formatCurrency(data.cost)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Return</p>
            <p className={`text-lg font-semibold ${data.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.return)}
              <span className="text-xs ml-1 font-normal">
                ({data.return_percentage.toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
