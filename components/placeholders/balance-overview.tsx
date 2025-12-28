/**
 * Balance Overview Placeholder
 * 
 * Placeholder for account balance and summary display.
 */

import { Wallet } from "lucide-react"

export function BalanceOverview() {
  return (
    <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-gray-900 dark:text-white" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Balance Overview
        </h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Total Balance
          </p>
          <div className="h-8 bg-gray-100 dark:bg-[#1F1F23] rounded animate-pulse" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Income
            </p>
            <div className="h-6 bg-gray-100 dark:bg-[#1F1F23] rounded animate-pulse" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Expenses
            </p>
            <div className="h-6 bg-gray-100 dark:bg-[#1F1F23] rounded animate-pulse" />
          </div>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Balance data will appear here once accounts are connected
        </p>
      </div>
    </div>
  )
}
