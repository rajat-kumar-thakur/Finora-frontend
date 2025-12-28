/**
 * Dashboard Page
 * 
 * Main dashboard overview page.
 * Displays placeholder sections for balance, transactions, and insights.
 * This is a shell that will be populated with real data in later phases.
 */

import { BalanceOverview, RecentTransactions, SpendingInsights } from '@/components/placeholders'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Welcome to your financial overview
        </p>
      </div>

      {/* Balance Section */}
      <BalanceOverview />

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions />
        <SpendingInsights />
      </div>
    </div>
  )
}
