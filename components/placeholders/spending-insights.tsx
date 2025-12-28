/**
 * Spending Insights Placeholder
 * 
 * Placeholder for financial insights and analytics.
 */

import { TrendingUp } from "lucide-react"

export function SpendingInsights() {
  return (
    <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-gray-900 dark:text-white" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Spending Insights
        </h2>
      </div>
      
      <div className="space-y-4">
        <div className="aspect-video bg-gray-100 dark:bg-[#1F1F23] rounded-lg flex items-center justify-center">
          <p className="text-sm text-gray-400 dark:text-gray-600">
            Chart area
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-gray-100 dark:bg-[#1F1F23] rounded animate-pulse" />
              <div className="h-4 bg-gray-100 dark:bg-[#1F1F23] rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Spending insights and analytics will be generated here
        </p>
      </div>
    </div>
  )
}
