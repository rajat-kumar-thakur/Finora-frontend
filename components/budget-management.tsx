"use client"

/**
 * Budget Management Component
 *
 * View, create, edit, and delete budgets with spending progress.
 */

import { useState, useEffect } from 'react'
import { budgetApi, type Budget, type BudgetCreate, type BudgetSummary } from '@/lib/api/budgets'
import { categoryApi, type Category } from '@/lib/api/categories'
import { Target, Plus, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react'

export function BudgetManagement() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Budget> | null>(null)
  const [newBudget, setNewBudget] = useState<BudgetCreate>({
    category_id: '',
    amount: 0,
    period: 'monthly',
  })
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [budgetsData, categoriesData, summaryData] = await Promise.all([
        budgetApi.list(),
        categoryApi.list(),
        budgetApi.getSummary(),
      ])
      setBudgets(budgetsData)
      setCategories(categoriesData)
      setSummary(summaryData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Get categories that don't have a budget yet
  const availableCategories = categories.filter(
    cat => !budgets.some(b => b.category_id === cat.id)
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newBudget.category_id) {
      setError('Please select a category')
      return
    }
    if (!newBudget.amount || newBudget.amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setCreating(true)
    setError(null)

    try {
      await budgetApi.create(newBudget)
      setNewBudget({ category_id: '', amount: 0, period: 'monthly' })
      setShowCreateForm(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create budget')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (budgetId: string) => {
    setDeleting(budgetId)
    setError(null)

    try {
      await budgetApi.delete(budgetId)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete budget')
    } finally {
      setDeleting(null)
    }
  }

  const handleEdit = (budget: Budget) => {
    setEditingId(budget.id)
    setEditForm({ amount: budget.amount, period: budget.period, is_active: budget.is_active })
    setShowCreateForm(false)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const handleUpdate = async (budgetId: string) => {
    if (!editForm || !editForm.amount || editForm.amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setUpdating(true)
    setError(null)

    try {
      await budgetApi.update(budgetId, {
        amount: editForm.amount,
        period: editForm.period as 'weekly' | 'monthly',
        is_active: editForm.is_active,
      })
      setEditingId(null)
      setEditForm(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update budget')
    } finally {
      setUpdating(false)
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) {
      return (
        <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          Exceeded
        </span>
      )
    }
    if (percentage >= 80) {
      return (
        <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
          Warning
        </span>
      )
    }
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
        On Track
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="text-sm text-muted-foreground">Total Budgeted</div>
            <div className="text-xl font-semibold text-foreground mt-1">
              {summary.total_budgeted.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            </div>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="text-sm text-muted-foreground">Total Spent</div>
            <div className="text-xl font-semibold text-foreground mt-1">
              {summary.total_spent.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            </div>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="text-sm text-muted-foreground">Remaining</div>
            <div className="text-xl font-semibold text-green-600 dark:text-green-400 mt-1">
              {summary.total_remaining.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            </div>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="text-sm text-muted-foreground">Overall Usage</div>
            <div className="text-xl font-semibold text-foreground mt-1">
              {summary.overall_percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Budgets List */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Target className="h-5 w-5" />
            Category Budgets
          </h2>
          {availableCategories.length > 0 && (
            <button
              onClick={() => {
                setShowCreateForm(true)
                setEditingId(null)
                setEditForm(null)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Budget
            </button>
          )}
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <form onSubmit={handleCreate} className="p-4 border-b border-border bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Category</label>
                <select
                  value={newBudget.category_id}
                  onChange={(e) => setNewBudget({ ...newBudget, category_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select category</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Amount</label>
                <input
                  type="number"
                  value={newBudget.amount || ''}
                  onChange={(e) => setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="Budget amount"
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Period</label>
                <select
                  value={newBudget.period}
                  onChange={(e) => setNewBudget({ ...newBudget, period: e.target.value as 'weekly' | 'monthly' })}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-2 text-sm border border-input rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Budget Items */}
        <div className="divide-y divide-border">
          {budgets.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No budgets set up yet</p>
              <p className="text-sm mt-1">Create your first budget to start tracking spending</p>
            </div>
          ) : (
            budgets.map((budget) => (
              <div key={budget.id} className="p-4">
                {editingId === budget.id ? (
                  /* Edit Mode */
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Category</label>
                      <div className="flex items-center gap-2 px-3 py-2 text-sm border border-input rounded-md bg-muted">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: budget.category_color || '#6B7280' }}
                        />
                        {budget.category_name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Amount</label>
                      <input
                        type="number"
                        value={editForm?.amount || ''}
                        onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Period</label>
                      <select
                        value={editForm?.period || budget.period}
                        onChange={(e) => setEditForm({ ...editForm, period: e.target.value as 'weekly' | 'monthly' })}
                        className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(budget.id)}
                        disabled={updating}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                        {updating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-2 text-sm border border-input rounded-md hover:bg-muted transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: budget.category_color || '#6B7280' }}
                        />
                        <div>
                          <div className="font-medium text-foreground">{budget.category_name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{budget.period}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(budget.percentage_used)}
                        <div className="text-right">
                          <div className="font-medium text-foreground">
                            {budget.spent.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            of {budget.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(budget)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id)}
                            disabled={deleting === budget.id}
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor(budget.percentage_used)} transition-all duration-300`}
                        style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{budget.percentage_used.toFixed(1)}% used</span>
                      <span>
                        {budget.remaining.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} remaining
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
