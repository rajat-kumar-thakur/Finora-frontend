/**
 * Dashboard Page
 * 
 * Main dashboard overview page with modern dark theme design.
 */

'use client'

import { useState } from 'react'
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Welcome to your financial overview</p>
          </div>
          <Link
            href="/upload"
            className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors shadow-sm"
          >
            Upload Statement
          </Link>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Accounts & Summary */}
          <div className="lg:col-span-2 space-y-4">
            {/* Net Worth / Accounts */}
            <NetWorthCard key={`networth-${refreshTrigger}`} />
            
            {/* Monthly Summary */}
            <MonthlySummaryCard key={`summary-${refreshTrigger}`} />
          </div>

          {/* Right Column - Recent Transactions */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Recent Transactions</h2>
                <Link
                  href="/transactions"
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  View All →
                </Link>
              </div>
              <TransactionList 
                filters={{ page: 1, page_size: 10 }} 
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

