/**
 * Investments Page
 * 
 * Manage investments, track portfolio performance and net worth.
 */

'use client'

import { useState } from 'react'
import { InvestmentList } from '@/components/investment-list'
import { PortfolioSummaryView } from '@/components/portfolio-summary'
import { NetWorthTrend } from '@/components/net-worth-trend'

export default function InvestmentsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUpdate = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Investments
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your stocks and mutual funds portfolio
          </p>
        </div>
      </div>

      {/* Portfolio Summary */}
      <PortfolioSummaryView refreshTrigger={refreshTrigger} />
      
      {/* Investment List */}
      <InvestmentList onUpdate={handleUpdate} />

      {/* Net Worth Trend */}
      <NetWorthTrend refreshTrigger={refreshTrigger} />
    </div>
  )
}
