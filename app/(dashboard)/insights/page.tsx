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
    <div className="bg-background">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-5">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Insights
          </h1>
          <p className="text-sm text-muted-foreground">
            Understand your financial patterns and trends
          </p>
        </div>

        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
          <NetWorthCard />
          <MonthlySummaryCard />
        </div>



        {/* Category Breakdown */}
        <CategoryBreakdown />
      </div>
    </div>
  )
}
