/**
 * Investment API Client
 */

import { apiClient } from './client'

export interface Investment {
  id: string
  symbol: string
  name: string
  quantity: number
  purchase_price: number
  current_price: number
  investment_type: 'Stock' | 'Mutual Fund' | 'ETF' | 'Crypto' | 'Bond' | 'Other'
  purchase_date: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface InvestmentCreate {
  symbol: string
  name: string
  quantity: number
  purchase_price: number
  current_price: number
  investment_type: 'Stock' | 'Mutual Fund' | 'ETF' | 'Crypto' | 'Bond' | 'Other'
  purchase_date: string
}

export interface InvestmentUpdate {
  symbol?: string
  name?: string
  quantity?: number
  purchase_price?: number
  current_price?: number
  investment_type?: 'Stock' | 'Mutual Fund' | 'ETF' | 'Crypto' | 'Bond' | 'Other'
  purchase_date?: string
}

export interface TypeReturns {
  value: number
  cost: number
  return: number
  return_percentage: number
}

export interface PortfolioSummary {
  total_value: number
  total_cost: number
  total_return: number
  return_percentage: number
  allocation: Record<string, number>
  returns_by_type: Record<string, TypeReturns>
}

export const investmentApi = {
  getAll: async () => {
    return await apiClient.get<Investment[]>('/api/v1/investments/')
  },

  getSummary: async () => {
    return await apiClient.get<PortfolioSummary>('/api/v1/investments/summary')
  },

  getById: async (id: string) => {
    return await apiClient.get<Investment>(`/api/v1/investments/${id}`)
  },

  create: async (investment: InvestmentCreate) => {
    return await apiClient.post<Investment>('/api/v1/investments/', investment)
  },

  update: async (id: string, investment: InvestmentUpdate) => {
    return await apiClient.put<Investment>(`/api/v1/investments/${id}`, investment)
  },

  delete: async (id: string) => {
    await apiClient.delete(`/api/v1/investments/${id}`)
  }
}
