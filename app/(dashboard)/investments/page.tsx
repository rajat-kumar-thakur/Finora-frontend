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
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Investments</h1>
        <p className="page-subtitle">Manage your stocks and mutual funds portfolio</p>
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
