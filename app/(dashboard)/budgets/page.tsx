/**
 * Budgets Page
 *
 * Manage spending budgets per category.
 */

'use client'

import { BudgetManagement } from '@/components/budget-management'

export default function BudgetsPage() {
  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">
          Budgets
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Set spending limits for categories and track your progress
        </p>
      </div>

      {/* Budget Management */}
      <BudgetManagement />
    </div>
  )
}
