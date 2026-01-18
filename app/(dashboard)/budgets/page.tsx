/**
 * Budgets Page
 *
 * Manage spending budgets per category.
 */

'use client'

import { BudgetManagement } from '@/components/budget-management'

export default function BudgetsPage() {
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Budgets</h1>
        <p className="page-subtitle">Set spending limits for categories and track your progress</p>
      </div>

      {/* Budget Management */}
      <BudgetManagement />
    </div>
  )
}
