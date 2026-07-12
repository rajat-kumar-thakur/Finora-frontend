"use client"

/**
 * Transaction Create Modal Component
 *
 * Modal for manually adding a transaction.
 */

import { useState, useEffect } from 'react'
import { transactionApi, categoryApi, type TransactionCreate, type Category } from '@/lib/api'
import { AccountSelector } from '@/components/account-selector'

interface TransactionCreateModalProps {
  onClose: () => void
  onSaved: () => void
}

export function TransactionCreateModal({ onClose, onSaved }: TransactionCreateModalProps) {
  const [formData, setFormData] = useState<TransactionCreate>({
    date: new Date().toISOString(),
    description: '',
    amount: 0,
    transaction_type: 'debit',
    category_id: undefined,
    account_id: undefined,
    balance: undefined,
    source: 'manual',
    raw_text: undefined,
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestBalance, setLatestBalance] = useState<number | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  // Reload latest balance whenever the selected account changes
  useEffect(() => {
    if (!formData.account_id) return
    let cancelled = false
    const load = async () => {
      try {
        const response = await transactionApi.list({
          account_id: formData.account_id,
          page: 1,
          page_size: 1,
        })
        if (cancelled) return
        if (response.transactions.length > 0) {
          setLatestBalance(response.transactions[0].balance || 0)
        } else {
          setLatestBalance(0)
        }
      } catch {
        if (!cancelled) setLatestBalance(0)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [formData.account_id])

  useEffect(() => {
    if (latestBalance !== null && formData.amount) {
      const amount = formData.amount
      if (!isNaN(amount)) {
        const newBalance = formData.transaction_type === 'credit'
          ? latestBalance + amount
          : latestBalance - amount

        setFormData(prev => ({
          ...prev,
          balance: parseFloat(newBalance.toFixed(2))
        }))
      }
    }
  }, [formData.amount, formData.transaction_type, latestBalance])

  const loadCategories = async () => {
    try {
      const data = await categoryApi.list()
      setCategories(data)
    } catch {
      // Silently fail - categories will show empty
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await transactionApi.create(formData)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="bg-popover rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-border animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Add Transaction</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="alert-error">{error}</div>
          )}

          {/* Bank Account */}
          <AccountSelector
            id="tx-account"
            label="Bank Account"
            value={formData.account_id}
            onChange={(accountId) => setFormData({ ...formData, account_id: accountId })}
          />

          {/* Date */}
          <div>
            <label htmlFor="tx-date" className="block text-sm font-medium text-foreground mb-1">
              Date
            </label>
            <input
              type="date"
              id="tx-date"
              value={new Date(formData.date).toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
              className="input-sm"
              required
              placeholder="Transaction date"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="tx-description" className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <input
              type="text"
              id="tx-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-sm"
              required
              placeholder="e.g., Grocery store"
            />
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="tx-amount" className="block text-sm font-medium text-foreground mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              id="tx-amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="input-sm"
              required
              placeholder="0.00"
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="tx-type" className="block text-sm font-medium text-foreground mb-1">
              Type
            </label>
            <select
              id="tx-type"
              value={formData.transaction_type}
              onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as 'debit' | 'credit' })}
              className="input-sm"
              required
              title="Transaction type"
            >
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="tx-category" className="block text-sm font-medium text-foreground mb-1">
              Category
            </label>
            <select
              id="tx-category"
              value={formData.category_id || ''}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value || undefined })}
              className="input-sm"
              title="Select category"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Balance (optional) */}
          <div>
            <label htmlFor="tx-balance" className="block text-sm font-medium text-foreground mb-1">
              Balance (optional)
            </label>
            <input
              type="number"
              step="0.01"
              id="tx-balance"
              value={formData.balance ?? ''}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value ? parseFloat(e.target.value) : undefined })}
              className="input-sm"
              placeholder="After this transaction"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Transaction'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-accent disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
