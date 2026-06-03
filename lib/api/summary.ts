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
  total_invested: number
  income_count: number
  expense_count: number
  invested_count: number
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

export interface NetWorthAccountBreakdown {
  account_id: string
  name: string
  bank_name: string
  is_primary: boolean
  balance: number
}

export interface NetWorth {
  bank_balance: number
  investments: number
  total_net_worth: number
  accounts?: NetWorthAccountBreakdown[]
  note: string
  calculated_at: string
}

export const summaryApi = {
  /**
   * Get monthly summary, optionally scoped to one bank account.
   */
  monthly: async (
    year: number,
    month: number,
    accountId?: string
  ): Promise<MonthlySummary> => {
    const params: Record<string, string | number> = { year, month }
    if (accountId) params.account_id = accountId
    return apiClient.get<MonthlySummary>('/api/v1/summary/monthly', {
      params: params as Record<string, string | number | boolean>,
    })
  },

  /**
   * Get category breakdown.
   */
  categoryBreakdown: async (filters?: {
    start_date?: string
    end_date?: string
    transaction_type?: 'debit' | 'credit'
    account_id?: string
    // 'exclude' = spending view (no investments), 'only' = investments view,
    // 'include' = net view (investments counted as outflow)
    investments?: 'exclude' | 'only' | 'include'
  }): Promise<CategoryBreakdownResponse> => {
    return apiClient.get<CategoryBreakdownResponse>('/api/v1/summary/category-breakdown', {
      params: filters as Record<string, string>,
    })
  },

  /**
   * Get net worth (cumulative across all accounts + per-account breakdown).
   */
  netWorth: async (): Promise<NetWorth> => {
    return apiClient.get<NetWorth>('/api/v1/summary/net-worth')
  },
}
