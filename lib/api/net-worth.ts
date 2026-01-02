/**
 * Net Worth API Client
 */

import { apiClient } from './client'

export interface NetWorthEntry {
  id: string
  date: string
  total_assets: number
  total_liabilities: number
  net_worth: number
  currency: string
  user_id: string
  created_at: string
}

export interface CurrentNetWorth {
  bank_balance: number
  investment_value: number
  total_assets: number
  total_liabilities: number
  net_worth: number
}

export const netWorthApi = {
  getCurrent: async () => {
    return await apiClient.get<CurrentNetWorth>('/api/v1/net-worth/current')
  },

  getHistory: async (limit: number = 30) => {
    return await apiClient.get<NetWorthEntry[]>('/api/v1/net-worth/history', {
      params: { limit }
    })
  },

  createSnapshot: async () => {
    return await apiClient.post<NetWorthEntry>('/api/v1/net-worth/snapshot')
  }
}
