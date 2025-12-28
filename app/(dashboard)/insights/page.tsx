/**
 * Insights Page
 * 
 * Financial insights and analytics.
 */

'use client'

import { MonthlySummaryCard } from '@/components/monthly-summary'
import { CategoryBreakdown } from '@/components/category-breakdown'
import { NetWorthCard } from '@/components/net-worth-card'

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Insights
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Understand your financial patterns and trends
        </p>
      </div>

      {/* Net Worth */}
      <NetWorthCard />

      {/* Monthly Summary */}
      <MonthlySummaryCard />

      {/* Category Breakdown */}
      <CategoryBreakdown />
    </div>
  )
}
