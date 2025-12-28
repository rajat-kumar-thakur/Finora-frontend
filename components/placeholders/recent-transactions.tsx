/**
 * Recent Transactions Placeholder
 * 
 * Placeholder for transaction list display.
 */

import { ArrowLeftRight } from "lucide-react"

export function RecentTransactions() {
  return (
    <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
      <div className="flex items-center gap-2 mb-4">
        <ArrowLeftRight className="w-5 h-5 text-gray-900 dark:text-white" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Recent Transactions
        </h2>
      </div>
      
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1F1F23] rounded-lg"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-gray-200 dark:bg-[#2B2B30] rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-[#2B2B30] rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-[#2B2B30] rounded w-1/2 animate-pulse" />
              </div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-[#2B2B30] rounded w-16 animate-pulse" />
          </div>
        ))}
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          Transaction history will appear here
        </p>
      </div>
    </div>
  )
}
