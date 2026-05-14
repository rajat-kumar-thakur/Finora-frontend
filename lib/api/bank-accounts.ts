/**
 * Bank Account API Client
 *
 * Type-safe API methods for managing multiple bank accounts.
 */

import { apiClient } from './client'

export interface BankAccount {
  id: string
  name: string
  bank_name: string
  account_number_last4: string | null
  is_primary: boolean
  notes: string | null
  current_balance: number
  transaction_count: number
  created_at: string
  updated_at: string
}

export interface BankAccountCreate {
  name: string
  bank_name: string
  account_number_last4?: string | null
  is_primary?: boolean
  notes?: string | null
}

export interface BankAccountUpdate {
  name?: string
  bank_name?: string
  account_number_last4?: string | null
  notes?: string | null
}

export const bankAccountApi = {
  /** Curated list of Indian banks supported by the dropdown (cached on the server). */
  getBanksList: async (): Promise<string[]> => {
    return apiClient.get<string[]>('/api/v1/bank-accounts/banks-list')
  },

  /** List all accounts for the current user, enriched with current balance + tx count. */
  list: async (): Promise<BankAccount[]> => {
    return apiClient.get<BankAccount[]>('/api/v1/bank-accounts/')
  },

  /** Get a single account. */
  get: async (id: string): Promise<BankAccount> => {
    return apiClient.get<BankAccount>(`/api/v1/bank-accounts/${id}`)
  },

  /** Create a new bank account. */
  create: async (data: BankAccountCreate): Promise<BankAccount> => {
    return apiClient.post<BankAccount>('/api/v1/bank-accounts/', data)
  },

  /** Partial update — name, bank, last4, notes. Does NOT toggle primary. */
  update: async (id: string, data: BankAccountUpdate): Promise<BankAccount> => {
    return apiClient.put<BankAccount>(`/api/v1/bank-accounts/${id}`, data)
  },

  /** Atomically set this account as primary (clears the old primary). */
  setPrimary: async (id: string): Promise<BankAccount> => {
    return apiClient.post<BankAccount>(`/api/v1/bank-accounts/${id}/set-primary`)
  },

  /** Delete an account. Errors surface as 400 with detail when guards trip. */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/v1/bank-accounts/${id}`)
  },
}
