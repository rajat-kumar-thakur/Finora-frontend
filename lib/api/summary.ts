/**
 * Summary API Client
 * 
 * Type-safe API methods for financial summaries and insights.
 */

import { apiClient } from './client'

export interface MonthlySummary {
  year: number
  month: number
  total_income: number
  total_expenses: number
  income_count: number
  expense_count: number
  net: number
}

export interface CategoryBreakdownItem {
  category_id: string
  category_name: string
  total: number
  count: number
}

export interface CategoryBreakdownResponse {
  breakdown: CategoryBreakdownItem[]
}

export interface NetWorth {
  bank_balance: number
  investments: number
  total_net_worth: number
  note: string
  calculated_at: string
}

export const summaryApi = {
  /**
   * Get monthly summary
   */
  monthly: async (year: number, month: number): Promise<MonthlySummary> => {
    return apiClient.get<MonthlySummary>('/api/v1/summary/monthly', {
      params: { year, month },
    })
  },

  /**
   * Get category breakdown
   */
  categoryBreakdown: async (filters?: {
    start_date?: string
    end_date?: string
    transaction_type?: 'debit' | 'credit'
  }): Promise<CategoryBreakdownResponse> => {
    return apiClient.get<CategoryBreakdownResponse>('/api/v1/summary/category-breakdown', {
      params: filters as Record<string, string>,
    })
  },

  /**
   * Get net worth
   */
  netWorth: async (): Promise<NetWorth> => {
    return apiClient.get<NetWorth>('/api/v1/summary/net-worth')
  },
}
