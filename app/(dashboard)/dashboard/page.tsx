/**
 * Dashboard Page
 * 
 * Main dashboard overview page with modern dark theme design.
 */

'use client'

import { useState, useEffect } from 'react'
import { NetWorthCard } from '@/components/net-worth-card'
import { MonthlySummaryCard } from '@/components/monthly-summary'
import { TransactionList } from '@/components/transaction-list'
import Link from 'next/link'

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUpdate = () => {
    // Increment trigger to refresh all components
    setRefreshTrigger(prev => prev + 1)
  }

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1)
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4rem)] overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Welcome to your financial overview</p>
          </div>
          <Link
            href="/upload"
            className="px-4 py-2.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors shadow-sm text-center sm:w-auto w-full"
          >
            Upload Statement
          </Link>
        </div>

        {/* Main Grid - Mobile-first: stacked, then side-by-side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-4">
          {/* Left Column - Accounts & Summary */}
          <div className="lg:col-span-2 space-y-4 order-1">
            {/* Total Balance / Accounts */}
            <NetWorthCard refreshTrigger={refreshTrigger} />

            {/* Monthly Summary */}
            <MonthlySummaryCard refreshTrigger={refreshTrigger} />
          </div>

          {/* Right Column - Recent Transactions */}
          <div className="lg:col-span-1 order-2">
            <div className="bg-card rounded-xl border border-border shadow-sm p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-sm sm:text-base font-semibold text-foreground">Recent Transactions</h2>
                <Link
                  href="/transactions"
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  View All →
                </Link>
              </div>
              <TransactionList
                filters={{ page: 1, page_size: 6 }}
                onUpdate={handleUpdate}
                compact={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

