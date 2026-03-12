/**
 * Fixed Deposit API Client
 */

import { apiClient } from './client'

export interface FixedDeposit {
  id: string
  bank_name: string
  deposit_type: 'FD' | 'RD'
  depositor_type: 'General' | 'Senior Citizen' | 'Super Senior Citizen'
  principal_amount: number
  interest_rate: number
  tenure_days: number
  start_date: string
  maturity_date: string
  maturity_amount: number
  status: 'Active' | 'Matured' | 'Withdrawn'
  notes?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface FixedDepositCreate {
  deposit_type: 'FD' | 'RD'
  depositor_type: 'General' | 'Senior Citizen' | 'Super Senior Citizen'
  principal_amount: number
  tenure_days: number
  start_date: string
  notes?: string
}

export interface FixedDepositUpdate {
  status?: 'Active' | 'Matured' | 'Withdrawn'
  notes?: string
}

export interface FixedDepositSummary {
  total_invested: number
  total_maturity_value: number
  total_interest_earned: number
  count_by_status: Record<string, number>
  count_by_type: Record<string, number>
}

export interface RateEntry {
  min_days: number
  max_days: number
  general: number
  senior: number
  super_senior: number
}

export const fixedDepositApi = {
  getAll: async () => {
    return await apiClient.get<FixedDeposit[]>('/api/v1/fixed-deposits/')
  },

  getSummary: async () => {
    return await apiClient.get<FixedDepositSummary>('/api/v1/fixed-deposits/summary')
  },

  getRates: async (depositType: string = 'FD') => {
    return await apiClient.get<RateEntry[]>(`/api/v1/fixed-deposits/rates?deposit_type=${depositType}`)
  },

  lookupRate: async (depositType: string, depositorType: string, tenureDays: number) => {
    return await apiClient.get<{ rate: number }>(
      `/api/v1/fixed-deposits/rates/lookup?deposit_type=${depositType}&depositor_type=${encodeURIComponent(depositorType)}&tenure_days=${tenureDays}`
    )
  },

  getById: async (id: string) => {
    return await apiClient.get<FixedDeposit>(`/api/v1/fixed-deposits/${id}`)
  },

  create: async (data: FixedDepositCreate) => {
    return await apiClient.post<FixedDeposit>('/api/v1/fixed-deposits/', data)
  },

  update: async (id: string, data: FixedDepositUpdate) => {
    return await apiClient.put<FixedDeposit>(`/api/v1/fixed-deposits/${id}`, data)
  },

  delete: async (id: string) => {
    await apiClient.delete(`/api/v1/fixed-deposits/${id}`)
  },
}
