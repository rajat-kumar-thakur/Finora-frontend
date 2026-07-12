"use client"

import { useState, useEffect, useCallback } from "react"
import { TrendingUp, TrendingDown, Minus, RefreshCw, Award, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/components/ui/use-toast"
import {
  chartAxisTick,
  chartAxisLine,
  chartGrid,
} from "@/lib/chart-theme"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type ScoreGrade = "A+" | "A" | "B+" | "B" | "C" | "D" | "F"

interface FinanceScoreMetrics {
  budget_adherence_score: number
  savings_rate_score: number
  spending_trend_score: number
  consistency_score: number
  category_balance_score: number
}

interface FinanceScore {
  user_id: string
  score: number
  grade: ScoreGrade
  metrics: FinanceScoreMetrics
  calculated_at: string
  period_start: string
  period_end: string
  previous_score?: number
  score_change?: number
  trend?: "up" | "down" | "stable"
  insights?: string[]
  recommendations?: string[]
}

interface HistoryEntry {
  score: number
  grade: ScoreGrade
  calculated_at: string
  period_start: string
}

const GRADE_VARIANT: Record<ScoreGrade, "positive" | "warning" | "destructive"> = {
  "A+": "positive",
  "A": "positive",
  "B+": "warning",
  "B": "warning",
  "C": "warning",
  "D": "destructive",
  "F": "destructive",
}

const METRIC_LABELS: Record<keyof FinanceScoreMetrics, { label: string; description: string; weight: string }> = {
  budget_adherence_score: {
    label: "Budget Adherence",
    description: "How well you stay within budgets",
    weight: "35%"
  },
  savings_rate_score: {
    label: "Savings Rate",
    description: "Percentage of income saved",
    weight: "30%"
  },
  spending_trend_score: {
    label: "Spending Trend",
    description: "Spending compared to previous period",
    weight: "20%"
  },
  consistency_score: {
    label: "Consistency",
    description: "Regular financial activity",
    weight: "10%"
  },
  category_balance_score: {
    label: "Category Balance",
    description: "Diversification of spending",
    weight: "5%"
  }
}

export default function FinanceScoreCard() {
  const [score, setScore] = useState<FinanceScore | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const { toast } = useToast()

  const fetchScoreData = useCallback(async () => {
    try {
      setLoading(true)
      const [currentData, historyData] = await Promise.all([
        apiClient.get<FinanceScore>("/api/v1/finance-score/current"),
        apiClient.get<{ scores: HistoryEntry[] }>("/api/v1/finance-score/history?limit=12")
      ])

      setScore(currentData || null)
      setHistory(historyData?.scores || [])
    } catch (error) {
      if ((error as { response?: { status?: number } })?.response?.status !== 404) {
        toast({
          title: "Error",
          description: "Failed to load finance score",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchScoreData()
  }, [fetchScoreData])

  const handleCalculate = async () => {
    try {
      setCalculating(true)
      await apiClient.post("/api/v1/finance-score/calculate", { save: true })
      toast({ title: "Finance score calculated successfully" })
      await fetchScoreData()
    } catch {
      toast({
        title: "Error",
        description: "Failed to calculate finance score",
        variant: "destructive"
      })
    } finally {
      setCalculating(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-positive"
    if (score >= 50) return "text-warning"
    return "text-negative"
  }

  const getMetricColor = (value: number) => {
    if (value >= 60) return "bg-positive"
    if (value >= 30) return "bg-warning"
    return "bg-negative"
  }

  const getTrendIcon = () => {
    if (!score?.trend) return <Minus className="h-5 w-5 text-muted-foreground" />
    if (score.trend === "up") return <TrendingUp className="h-5 w-5 text-positive" />
    if (score.trend === "down") return <TrendingDown className="h-5 w-5 text-negative" />
    return <Minus className="h-5 w-5 text-muted-foreground" />
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const chartData = history.map(entry => ({
    date: formatDate(entry.period_start),
    score: entry.score,
    grade: entry.grade
  }))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex justify-center md:col-span-1">
              <Skeleton className="h-40 w-40 rounded-full" />
            </div>
            <div className="md:col-span-2 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!score) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Finance Health Score</CardTitle>
          <CardDescription>
            Calculate your financial health score based on budget adherence, savings, and spending patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="empty-state">
            <div className="icon-box-lg mb-4">
              <Award className="h-6 w-6" />
            </div>
            <p className="empty-state-text mb-4">
              No score calculated yet. Click below to generate your first finance score.
            </p>
            <Button onClick={handleCalculate} disabled={calculating}>
              <Target className="mr-2 h-4 w-4" />
              {calculating ? "Calculating..." : "Calculate My Score"}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const scoreColor = getScoreColor(score.score)
  const ringRadius = 70
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference * (1 - Math.round(score.score) / 100)

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Finance Health Score</CardTitle>
              <CardDescription>
                Period: {formatDate(score.period_start)} - {formatDate(score.period_end)}
              </CardDescription>
            </div>
            <Button onClick={handleCalculate} disabled={calculating} size="sm" variant="outline">
              <RefreshCw className={`mr-2 h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
              Recalculate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Display — SVG progress ring */}
            <div className="text-center md:col-span-1">
              <div className="relative inline-flex items-center justify-center">
                <svg width="160" height="160" viewBox="0 0 160 160" className={scoreColor} role="img" aria-label={`Score ${Math.round(score.score)} of 100, grade ${score.grade}`}>
                  <circle cx="80" cy="80" r={ringRadius} fill="none" stroke="var(--border)" strokeWidth="8" />
                  <circle
                    cx="80"
                    cy="80"
                    r={ringRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    transform="rotate(-90 80 80)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                  <span className={`font-numeric text-5xl font-semibold ${scoreColor}`}>
                    {Math.round(score.score)}
                  </span>
                  <Badge variant={GRADE_VARIANT[score.grade]}>{score.grade}</Badge>
                </div>
              </div>
              {score.score_change !== undefined && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  {getTrendIcon()}
                  <span className={`font-numeric ${score.trend === "up" ? "text-positive" : score.trend === "down" ? "text-negative" : "text-muted-foreground"}`}>
                    {score.score_change > 0 ? "+" : ""}{Math.round(score.score_change)} points
                  </span>
                </div>
              )}
            </div>

            {/* Metrics Breakdown */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="section-title mb-3">Score Breakdown</h3>
              {Object.entries(score.metrics).map(([key, value]) => {
                const metric = METRIC_LABELS[key as keyof FinanceScoreMetrics]
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{metric.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {metric.weight}
                        </Badge>
                      </div>
                      <span className={`font-numeric ${getScoreColor(value)}`}>{Math.round(value)}</span>
                    </div>
                    <Progress value={value} className="h-2" indicatorClassName={getMetricColor(value)} />
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      {(score.insights || score.recommendations) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {score.insights && score.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {score.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {score.recommendations && score.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {score.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Target className="h-4 w-4 mt-0.5 text-positive flex-shrink-0" />
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Historical Trend */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Score History</CardTitle>
            <CardDescription>Track your financial health over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]" role="img" aria-label="Score history line chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid {...chartGrid} />
                  <XAxis
                    dataKey="date"
                    tick={chartAxisTick}
                    axisLine={chartAxisLine}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={chartAxisTick}
                    axisLine={chartAxisLine}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="text-xs text-muted-foreground">{payload[0].payload.date}</p>
                            <p className="font-numeric text-sm text-foreground">Score: {payload[0].value}</p>
                            <p className="text-sm text-muted-foreground">Grade: {payload[0].payload.grade}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  {/* Glow underlay */}
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--chart-1)"
                    strokeWidth={6}
                    strokeOpacity={0.25}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--chart-1)', r: 4 }}
                    activeDot={{ r: 6, stroke: 'var(--background)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
