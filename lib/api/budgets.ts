/**
 * Budget API Client
 *
 * Type-safe API methods for budget operations.
 */

import { apiClient } from './client'

export interface Budget {
  id: string
  category_id: string
  category_name: string | null
  category_color: string | null
  amount: number
  period: 'weekly' | 'monthly'
  is_active: boolean
  spent: number
  remaining: number
  percentage_used: number
  period_start: string
  period_end: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface BudgetCreate {
  category_id: string
  amount: number
  period?: 'weekly' | 'monthly'
  is_active?: boolean
}

export interface BudgetUpdate {
  amount?: number
  period?: 'weekly' | 'monthly'
  is_active?: boolean
}

export interface BudgetSummary {
  total_budgeted: number
  total_spent: number
  total_remaining: number
  budgets_on_track: number
  budgets_warning: number
  budgets_exceeded: number
  overall_percentage: number
}

export interface BudgetStatus {
  status: 'ok' | 'warning' | 'exceeded'
  budget: Budget | null
  message: string
}

export const budgetApi = {
  /**
   * List all budgets with spending info
   */
  list: async (activeOnly: boolean = false): Promise<Budget[]> => {
    const params = activeOnly ? { active_only: 'true' } : {}
    return apiClient.get<Budget[]>('/api/v1/budgets', { params })
  },

  /**
   * Get budget summary
   */
  getSummary: async (): Promise<BudgetSummary> => {
    return apiClient.get<BudgetSummary>('/api/v1/budgets/summary')
  },

  /**
   * Get a single budget
   */
  get: async (id: string): Promise<Budget> => {
    return apiClient.get<Budget>(`/api/v1/budgets/${id}`)
  },

  /**
   * Create a new budget
   */
  create: async (data: BudgetCreate): Promise<Budget> => {
    return apiClient.post<Budget>('/api/v1/budgets', data)
  },

  /**
   * Update a budget
   */
  update: async (id: string, data: BudgetUpdate): Promise<Budget> => {
    return apiClient.put<Budget>(`/api/v1/budgets/${id}`, data)
  },

  /**
   * Delete a budget
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/v1/budgets/${id}`)
  },

  /**
   * Check budget status for a category
   */
  checkStatus: async (categoryId: string, additionalAmount: number = 0): Promise<BudgetStatus> => {
    return apiClient.get<BudgetStatus>(`/api/v1/budgets/category/${categoryId}/status`, {
      params: { additional_amount: additionalAmount.toString() }
    })
  },
}
