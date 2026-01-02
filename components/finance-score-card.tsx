"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Minus, RefreshCw, Award, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/components/ui/use-toast"
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

const GRADE_COLORS: Record<ScoreGrade, { bg: string; text: string; border: string }> = {
  "A+": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-500" },
  "A": { bg: "bg-green-50", text: "text-green-700", border: "border-green-500" },
  "B+": { bg: "bg-lime-50", text: "text-lime-700", border: "border-lime-500" },
  "B": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-500" },
  "C": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-500" },
  "D": { bg: "bg-red-50", text: "text-red-700", border: "border-red-500" },
  "F": { bg: "bg-red-100", text: "text-red-900", border: "border-red-700" }
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

  useEffect(() => {
    fetchScoreData()
  }, [])

  const fetchScoreData = async () => {
    try {
      setLoading(true)
      const [currentData, historyData] = await Promise.all([
        apiClient.get("/api/v1/finance-score/current"),
        apiClient.get("/api/v1/finance-score/history?limit=12")
      ])
      
      setScore(currentData || null)
      setHistory(historyData?.scores || [])
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast({
          title: "Error",
          description: "Failed to load finance score",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = async () => {
    try {
      setCalculating(true)
      await apiClient.post("/api/v1/finance-score/calculate", { save: true })
      toast({ title: "Finance score calculated successfully" })
      await fetchScoreData()
    } catch (error) {
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
    if (score >= 90) return "text-emerald-600"
    if (score >= 80) return "text-green-600"
    if (score >= 70) return "text-lime-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 50) return "text-orange-600"
    return "text-red-600"
  }

  const getMetricColor = (value: number) => {
    if (value >= 80) return "bg-emerald-500"
    if (value >= 60) return "bg-green-500"
    if (value >= 40) return "bg-yellow-500"
    if (value >= 20) return "bg-orange-500"
    return "bg-red-500"
  }

  const getTrendIcon = () => {
    if (!score?.trend) return <Minus className="h-5 w-5 text-gray-500" />
    if (score.trend === "up") return <TrendingUp className="h-5 w-5 text-green-600" />
    if (score.trend === "down") return <TrendingDown className="h-5 w-5 text-red-600" />
    return <Minus className="h-5 w-5 text-gray-500" />
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
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading finance score...
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
          <div className="text-center py-8">
            <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
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

  const gradeStyle = GRADE_COLORS[score.grade]

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <Card className={`border-2 ${gradeStyle.border}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Finance Health Score</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
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
            {/* Score Display */}
            <div className="text-center md:col-span-1">
              <div className={`inline-flex flex-col items-center justify-center rounded-full w-40 h-40 border-8 ${gradeStyle.border} ${gradeStyle.bg} dark:bg-opacity-20`}>
                <div className={`text-5xl font-bold ${getScoreColor(score.score)}`}>
                  {Math.round(score.score)}
                </div>
                <div className={`text-3xl font-bold ${gradeStyle.text} dark:brightness-125 mt-1`}>
                  {score.grade}
                </div>
              </div>
              {score.score_change !== undefined && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  {getTrendIcon()}
                  <span className={score.trend === "up" ? "text-green-600 dark:text-green-400" : score.trend === "down" ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}>
                    {score.score_change > 0 ? "+" : ""}{Math.round(score.score_change)} points
                  </span>
                </div>
              )}
            </div>

            {/* Metrics Breakdown */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">Score Breakdown</h3>
              {Object.entries(score.metrics).map(([key, value]) => {
                const metric = METRIC_LABELS[key as keyof FinanceScoreMetrics]
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{metric.label}</span>
                        <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                          {metric.weight}
                        </Badge>
                      </div>
                      <span className={getScoreColor(value)}>{Math.round(value)}</span>
                    </div>
                    <Progress value={value} className="h-2" indicatorClassName={getMetricColor(value)} />
                    <p className="text-xs text-gray-600 dark:text-gray-400">{metric.description}</p>
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
                      <TrendingUp className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{insight}</span>
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
                      <Target className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{rec}</span>
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
            <div className="[&_.recharts-cartesian-grid-horizontal>line]:stroke-gray-200 [&_.recharts-cartesian-grid-horizontal>line]:dark:stroke-gray-700 [&_.recharts-cartesian-grid-vertical>line]:stroke-gray-200 [&_.recharts-cartesian-grid-vertical>line]:dark:stroke-gray-700">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="date" 
                    className="text-gray-600 dark:text-gray-400"
                    tick={{ fill: 'currentColor' }}
                    stroke="currentColor"
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    className="text-gray-600 dark:text-gray-400"
                    tick={{ fill: 'currentColor' }}
                    stroke="currentColor"
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{payload[0].payload.date}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">Score: {payload[0].value}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">Grade: {payload[0].payload.grade}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
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
