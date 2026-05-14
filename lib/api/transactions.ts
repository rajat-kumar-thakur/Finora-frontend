/**
 * Transaction API Client
 * 
 * Type-safe API methods for transaction operations.
 */

import { apiClient } from './client'

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  transaction_type: 'debit' | 'credit'
  category_id: string | null
  category_name: string | null
  account_id: string | null
  account_name: string | null
  balance: number | null
  source: 'pdf' | 'manual'
  raw_text?: string
  is_transfer?: boolean
  transfer_pair_id?: string | null
  created_at: string
}

export interface TransactionCreate {
  date: string
  description: string
  amount: number
  transaction_type: 'debit' | 'credit'
  category_id?: string
  account_id?: string
  balance?: number
  source?: 'pdf' | 'manual'
  raw_text?: string
}

export interface TransactionUpdate {
  date?: string
  description?: string
  amount?: number
  transaction_type?: 'debit' | 'credit'
  category_id?: string
  account_id?: string
  balance?: number
  source?: 'pdf' | 'manual'
  raw_text?: string
}

export interface TransactionFilter {
  start_date?: string
  end_date?: string
  date?: string  // Exact date match
  transaction_type?: 'debit' | 'credit'
  category_id?: string
  account_id?: string  // Scope to a single bank account
  source?: 'pdf' | 'manual'
  description?: string  // Text search in description
  amount_min?: number
  amount_max?: number
  balance_min?: number
  balance_max?: number
  is_transfer?: boolean
  page?: number
  page_size?: number
}

export interface TransferCreate {
  from_account_id: string
  to_account_id: string
  amount: number
  date: string
  description?: string
  category_id?: string
}

export interface TransferResponse {
  transfer_pair_id: string
  debit: Transaction
  credit: Transaction
}

export interface TransactionListResponse {
  transactions: Transaction[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export const transactionApi = {
  /**
   * List transactions with optional filters
   */
  list: async (filters?: TransactionFilter): Promise<TransactionListResponse> => {
    return apiClient.get<TransactionListResponse>('/api/v1/transactions', {
      params: filters as Record<string, string | number | boolean>,
    })
  },

  /**
   * Get a single transaction
   */
  get: async (id: string): Promise<Transaction> => {
    return apiClient.get<Transaction>(`/api/v1/transactions/${id}`)
  },

  /**
   * Create a manual transaction
   */
  create: async (data: TransactionCreate): Promise<Transaction> => {
    return apiClient.post<Transaction>('/api/v1/transactions', data)
  },

  /**
   * Update a transaction
   */
  update: async (id: string, data: TransactionUpdate): Promise<Transaction> => {
    return apiClient.put<Transaction>(`/api/v1/transactions/${id}`, data)
  },

  /**
   * Delete a transaction. If the transaction is part of a transfer pair,
   * the linked leg is deleted server-side as well.
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/v1/transactions/${id}`)
  },

  /**
   * Create an inter-account transfer (atomic debit + credit pair).
   */
  transfer: async (data: TransferCreate): Promise<TransferResponse> => {
    return apiClient.post<TransferResponse>('/api/v1/transactions/transfer', data)
  },
}
