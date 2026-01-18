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
      <div className="max-w-7xl mx-auto page-container">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Insights</h1>
          <p className="page-subtitle">Understand your financial patterns and trends</p>
        </div>

        {/* Top Grid */}
        <div className="grid-dashboard">
          <NetWorthCard />
          <MonthlySummaryCard />
        </div>

        {/* Category Breakdown */}
        <CategoryBreakdown />
      </div>
    </div>
  )
}
