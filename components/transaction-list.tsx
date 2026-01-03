"use client"

/**
 * Transaction List Component
 * 
 * Displays paginated list of transactions with inline editing.
 */

import { useState, useEffect, useCallback } from 'react'
import { transactionApi, categoryApi, type Transaction, type TransactionFilter, type Category } from '@/lib/api'

interface TransactionListProps {
  filters?: TransactionFilter
  refreshTrigger?: number
  onUpdate?: () => void  // Callback to refresh parent component
  compact?: boolean  // Compact view for dashboard
}

export function TransactionList({ filters, refreshTrigger, onUpdate, compact = false }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string | number | undefined>>({})
  const [saving, setSaving] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [filterDebouncing, setFilterDebouncing] = useState(false)
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    transaction_type: 'debit',
    category_id: '',
    balance: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 50,
    total: 0,
    total_pages: 0,
  })
  
  // Column filters
  const [columnFilters, setColumnFilters] = useState({
    date: '',
    description: '',
    category_id: '',
    transaction_type: '',
    amount_min: '',
    amount_max: '',
    balance_min: '',
    balance_max: ''
  })

  // Modified loadTransactions to accept optional page override
  const loadTransactions = useCallback(async (pageOverride?: number) => {
    setLoading(true)
    setError(null)

    try {
      const currentPage = pageOverride || filters?.page || pagination.page || 1
      
      // Build filter object including column filters
      const filterParams: Record<string, string | number | undefined> = {
        ...filters,
        page: currentPage,
        page_size: filters?.page_size || 50,
      }
      
      // Add column filters if they have values
      if (columnFilters.description) {
        filterParams.description = columnFilters.description
      }
      if (columnFilters.category_id) {
        filterParams.category_id = columnFilters.category_id
      }
      if (columnFilters.transaction_type) {
        filterParams.transaction_type = columnFilters.transaction_type
      }
      if (columnFilters.date) {
        // Convert date string to datetime format (YYYY-MM-DDTHH:MM:SS) for API
        filterParams.date = columnFilters.date + 'T00:00:00'
      }
      if (columnFilters.amount_min) {
        filterParams.amount_min = parseFloat(columnFilters.amount_min)
      }
      if (columnFilters.amount_max) {
        filterParams.amount_max = parseFloat(columnFilters.amount_max)
      }
      if (columnFilters.balance_min) {
        filterParams.balance_min = parseFloat(columnFilters.balance_min)
      }
      if (columnFilters.balance_max) {
        filterParams.balance_max = parseFloat(columnFilters.balance_max)
      }
      
      const result = await transactionApi.list(filterParams)
      
      setTransactions(result.transactions)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, columnFilters])

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoryApi.list()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }, [])

  // Debounced effect for column filters (wait 500ms after user stops typing)
  useEffect(() => {
    setFilterDebouncing(true)
    const debounceTimer = setTimeout(() => {
      loadTransactions()
      setFilterDebouncing(false)
    }, 500) // 500ms delay

    return () => {
      clearTimeout(debounceTimer)
      setFilterDebouncing(false)
    }
  }, [columnFilters, loadTransactions])

  // Immediate effect for other filters (without debounce)
  useEffect(() => {
    loadTransactions()
  }, [loadTransactions, refreshTrigger])

  useEffect(() => {
    loadCategories()
  }, [loadCategories, refreshTrigger])

  // Auto-calculate balance when adding new transaction
  useEffect(() => {
    if (isAdding && newTransaction.amount && pagination.page === 1) {
      const amount = parseFloat(newTransaction.amount)
      if (!isNaN(amount)) {
        // Use the latest transaction's balance as the starting point
        // If no transactions exist, assume 0
        const latestTx = transactions[0]
        const currentBalance = latestTx?.balance || 0
        
        const newBalance = newTransaction.transaction_type === 'credit' 
          ? currentBalance + amount 
          : currentBalance - amount
          
        setNewTransaction(prev => ({
          ...prev,
          balance: newBalance.toFixed(2)
        }))
      }
    }
  }, [newTransaction.amount, newTransaction.transaction_type, isAdding, transactions, pagination.page])



  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id)
    setEditForm({
      date: tx.date.split('T')[0],
      description: tx.description,
      amount: String(tx.amount),
      transaction_type: tx.transaction_type,
      category_id: tx.category_id || '',
      balance: tx.balance !== null ? String(tx.balance) : '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    try {
      await transactionApi.update(id, {
        date: editForm.date as string,
        description: editForm.description as string,
        amount: parseFloat(editForm.amount as string),
        transaction_type: editForm.transaction_type as 'debit' | 'credit',
        category_id: editForm.category_id ? String(editForm.category_id) : undefined,
        balance: editForm.balance ? parseFloat(editForm.balance as string) : undefined,
      })
      await loadTransactions()
      setEditingId(null)
      setEditForm({})
      if (onUpdate) onUpdate()  // Refresh parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNew = async () => {
    if (!newTransaction.description || !newTransaction.amount) return
    
    setSaving(true)
    try {
      await transactionApi.create({
        date: newTransaction.date,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        transaction_type: newTransaction.transaction_type as 'credit' | 'debit',
        category_id: newTransaction.category_id || undefined,
        balance: newTransaction.balance ? parseFloat(newTransaction.balance) : undefined,
      })
      
      await loadTransactions()
      setIsAdding(false)
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        transaction_type: 'debit',
        category_id: '',
        balance: ''
      })
      if (onUpdate) onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction')
    } finally {
      setSaving(false)
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      await transactionApi.delete(id)
      await loadTransactions()
      if (onUpdate) onUpdate()  // Refresh parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const updateCategory = async (transactionId: string, categoryId: string) => {
    // Optimistically update in place to avoid full reload flicker
    const previous = transactions
    setTransactions(prev => prev.map(tx => tx.id === transactionId
      ? { ...tx, category_id: categoryId || null }
      : tx
    ))
    setEditingCategoryId(null)

    try {
      await transactionApi.update(transactionId, { category_id: categoryId || undefined })
      if (onUpdate) onUpdate()  // Refresh parent component
    } catch (err) {
      // Revert on failure
      setTransactions(previous)
      setError(err instanceof Error ? err.message : 'Failed to update category')
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.total_pages) return
    
    // Update pagination state immediately for UI responsiveness
    setPagination(prev => ({ ...prev, page: newPage }))
    
    // Reload transactions with new page
    // Note: We need to call loadTransactions with the new page
    // Since loadTransactions uses the state or props, we'll modify it to accept page param
    loadTransactions(newPage)
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  if (transactions.length === 0 && !isAdding) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-sm text-muted-foreground">No transactions yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Upload a statement or add manually</p>
        {!compact && (
          <button 
            onClick={() => setIsAdding(true)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            Add Transaction
          </button>
        )}
      </div>
    )
  }

  // Compact view for dashboard
  if (compact) {
    return (
      <div className="space-y-2">
        {transactions.map((tx) => {
          const category = categories.find(c => c.id === tx.category_id)
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  tx.transaction_type === 'credit' ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}>
                  <svg className={`w-4 h-4 ${tx.transaction_type === 'credit' ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {tx.transaction_type === 'credit' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    )}
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs truncate text-foreground">{tx.description}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                    {category && (
                      <span className="text-xs text-muted-foreground">• {category.icon} {category.name}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className={`text-xs font-semibold flex-shrink-0 ${
                tx.transaction_type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {tx.transaction_type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Mobile Transaction Card Component
  const TransactionCard = ({ tx }: { tx: Transaction }) => {
    const category = categories.find(c => c.id === tx.category_id)
    const isEditing = editingId === tx.id

    if (isEditing) {
      return (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Date</label>
              <input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Type</label>
              <select
                value={editForm.transaction_type}
                onChange={(e) => setEditForm({ ...editForm, transaction_type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
              >
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <input
              type="text"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Balance</label>
              <input
                type="number"
                step="0.01"
                value={editForm.balance || ''}
                onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                placeholder="Optional"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Category</label>
            <select
              value={editForm.category_id}
              onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">Uncategorized</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => saveEdit(tx.id)}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="flex-1 px-4 py-2.5 bg-accent text-foreground text-sm font-medium rounded-lg hover:bg-accent/80"
            >
              Cancel
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-card border border-border rounded-xl p-4 hover:bg-accent/30 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              tx.transaction_type === 'credit' ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              <svg className={`w-5 h-5 ${tx.transaction_type === 'credit' ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {tx.transaction_type === 'credit' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                )}
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground truncate">{tx.description}</div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                {category && (
                  <button
                    onClick={() => setEditingCategoryId(tx.id)}
                    className="text-xs px-2 py-0.5 rounded-full bg-accent/50 hover:bg-accent text-muted-foreground transition-colors"
                  >
                    {category.icon} {category.name}
                  </button>
                )}
                {!category && (
                  <button
                    onClick={() => setEditingCategoryId(tx.id)}
                    className="text-xs px-2 py-0.5 rounded-full bg-accent/50 hover:bg-accent text-muted-foreground transition-colors"
                  >
                    Uncategorized
                  </button>
                )}
              </div>
              {editingCategoryId === tx.id && (
                <select
                  value={tx.category_id || ''}
                  onChange={(e) => updateCategory(tx.id, e.target.value)}
                  onBlur={() => setEditingCategoryId(null)}
                  className="mt-2 w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
                  autoFocus
                >
                  <option value="">Uncategorized</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-sm font-semibold ${
              tx.transaction_type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {tx.transaction_type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            {tx.balance && (
              <div className="text-xs text-muted-foreground mt-0.5">
                Bal: ₹{tx.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          <button
            onClick={() => startEdit(tx)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete transaction: ${tx.description}?`)) {
                deleteTransaction(tx.id)
              }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    )
  }

  // Mobile Add Transaction Form
  const MobileAddForm = () => (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
      <div className="text-sm font-medium text-foreground">Add New Transaction</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Date</label>
          <input
            type="date"
            value={newTransaction.date}
            onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Type</label>
          <select
            value={newTransaction.transaction_type}
            onChange={(e) => setNewTransaction({ ...newTransaction, transaction_type: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
          >
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Description</label>
        <input
          type="text"
          value={newTransaction.description}
          onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
          placeholder="Enter description"
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={newTransaction.amount}
            onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
            placeholder="0.00"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Balance</label>
          <input
            type="number"
            step="0.01"
            value={newTransaction.balance}
            onChange={(e) => setNewTransaction({ ...newTransaction, balance: e.target.value })}
            placeholder="Auto"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Category</label>
        <select
          value={newTransaction.category_id}
          onChange={(e) => setNewTransaction({ ...newTransaction, category_id: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
        >
          <option value="">Uncategorized</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSaveNew}
          disabled={saving || !newTransaction.description || !newTransaction.amount}
          className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          Add Transaction
        </button>
        <button
          onClick={() => setIsAdding(false)}
          className="flex-1 px-4 py-2.5 bg-accent text-foreground text-sm font-medium rounded-lg hover:bg-accent/80"
        >
          Cancel
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {/* Mobile Filters Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90"
          >
            + Add Transaction
          </button>
        </div>

        {/* Mobile Add Form */}
        {isAdding && <MobileAddForm />}

        {/* Mobile Filters */}
        <div className="bg-card border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Filters</span>
            <button
              onClick={() => setColumnFilters({
                date: '',
                description: '',
                category_id: '',
                transaction_type: '',
                amount_min: '',
                amount_max: '',
                balance_min: '',
                balance_max: ''
              })}
              className="text-xs text-primary hover:text-primary/80"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={columnFilters.description}
              onChange={(e) => setColumnFilters({ ...columnFilters, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
              placeholder="Search..."
            />
            <select
              value={columnFilters.transaction_type}
              onChange={(e) => setColumnFilters({ ...columnFilters, transaction_type: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">All Types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>
          <select
            value={columnFilters.category_id}
            onChange={(e) => setColumnFilters({ ...columnFilters, category_id: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Cards */}
        <div className="space-y-3">
          {transactions.map((tx) => (
            <TransactionCard key={tx.id} tx={tx} />
          ))}
        </div>

        {/* Mobile Pagination */}
        {pagination.total > 0 && (
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="text-xs text-muted-foreground">
              Showing {transactions.length} of {pagination.total} transactions
            </div>
            {pagination.total_pages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-foreground px-3">
                  {pagination.page} / {pagination.total_pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.total_pages}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-accent/30 border-b border-border">
            <tr>
              <th className="text-left p-3 font-semibold text-foreground">Date</th>
              <th className="text-left p-3 font-semibold text-foreground">Description</th>
              <th className="text-left p-3 font-semibold text-foreground">Category</th>
              <th className="text-right p-3 font-semibold text-foreground">Type</th>
              <th className="text-right p-3 font-semibold text-foreground">Amount</th>
              <th className="text-right p-3 font-semibold text-foreground">Balance</th>
              <th className="text-center p-3 font-semibold text-foreground">Actions</th>
            </tr>
            {/* Filter Row */}
            <tr className="bg-accent/20">
              <th className="p-2">
                <input
                  type="date"
                  value={columnFilters.date}
                  onChange={(e) => setColumnFilters({ ...columnFilters, date: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                  placeholder="Filter date"
                />
              </th>
              <th className="p-2">
                <div className="relative">
                  <input
                    type="text"
                    value={columnFilters.description}
                    onChange={(e) => setColumnFilters({ ...columnFilters, description: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground pr-6"
                    placeholder="Search..."
                  />
                  {filterDebouncing && columnFilters.description && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
              </th>
              <th className="p-2">
                <select
                  value={columnFilters.category_id}
                  onChange={(e) => setColumnFilters({ ...columnFilters, category_id: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                >
                  <option value="">All</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </th>
              <th className="p-2">
                <select
                  value={columnFilters.transaction_type}
                  onChange={(e) => setColumnFilters({ ...columnFilters, transaction_type: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                >
                  <option value="">All</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </th>
              <th className="p-2">
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={columnFilters.amount_min}
                    onChange={(e) => setColumnFilters({ ...columnFilters, amount_min: e.target.value })}
                    className="w-1/2 px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={columnFilters.amount_max}
                    onChange={(e) => setColumnFilters({ ...columnFilters, amount_max: e.target.value })}
                    className="w-1/2 px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                    placeholder="Max"
                  />
                </div>
              </th>
              <th className="p-2">
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={columnFilters.balance_min}
                    onChange={(e) => setColumnFilters({ ...columnFilters, balance_min: e.target.value })}
                    className="w-1/2 px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={columnFilters.balance_max}
                    onChange={(e) => setColumnFilters({ ...columnFilters, balance_max: e.target.value })}
                    className="w-1/2 px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                    placeholder="Max"
                  />
                </div>
              </th>
              <th className="p-2">
                <button
                  onClick={() => setColumnFilters({
                    date: '',
                    description: '',
                    category_id: '',
                    transaction_type: '',
                    amount_min: '',
                    amount_max: '',
                    balance_min: '',
                    balance_max: ''
                  })}
                  className="w-full px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
                  title="Clear all filters"
                >
                  Clear
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* Add New Row */}
            {!compact && (
              isAdding ? (
                <tr className="bg-primary/5 border-b-2 border-primary/20">
                  <td className="p-2">
                    <input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                      placeholder="Description"
                      className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                      autoFocus
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={newTransaction.category_id}
                      onChange={(e) => setNewTransaction({ ...newTransaction, category_id: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={newTransaction.transaction_type}
                      onChange={(e) => setNewTransaction({ ...newTransaction, transaction_type: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground text-right"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.balance}
                      onChange={(e) => setNewTransaction({ ...newTransaction, balance: e.target.value })}
                      placeholder="Optional"
                      className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground text-right"
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={handleSaveNew}
                        disabled={saving || !newTransaction.description || !newTransaction.amount}
                        className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 disabled:opacity-50"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setIsAdding(false)}
                        className="px-2 py-1 bg-accent text-foreground text-xs rounded hover:bg-accent/80"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr 
                  className="hover:bg-accent/50 cursor-pointer border-b border-border border-dashed transition-colors"
                  onClick={() => setIsAdding(true)}
                >
                  <td colSpan={7} className="p-2 text-center text-xs text-muted-foreground hover:text-primary font-medium">
                    + Add new transaction
                  </td>
                </tr>
              )
            )}
            {transactions.map((tx) => {
              const isEditing = editingId === tx.id
              const category = categories.find(c => c.id === tx.category_id)
              
              return isEditing ? (
                // Edit Mode
                <tr key={tx.id} className="bg-primary/5">
                  <td className="p-2">
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={editForm.category_id}
                      onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={editForm.transaction_type}
                      onChange={(e) => setEditForm({ ...editForm, transaction_type: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground text-right"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.balance || ''}
                      onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground text-right"
                      placeholder="Optional"
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => saveEdit(tx.id)}
                        disabled={saving}
                        className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-2 py-1 bg-accent text-foreground text-xs rounded hover:bg-accent/80"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                // View Mode
                <tr key={tx.id} className="hover:bg-accent/30 transition-colors">
                  <td className="p-3 text-foreground whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </td>
                  <td className="p-3 text-foreground">
                    <div className="max-w-[300px] truncate whitespace-nowrap" style={{ direction: 'rtl', textAlign: 'left' }} title={tx.description}>
                      {tx.description}
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {editingCategoryId === tx.id ? (
                      <select
                        value={tx.category_id || ''}
                        onChange={(e) => updateCategory(tx.id, e.target.value)}
                        onBlur={() => setEditingCategoryId(null)}
                        className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                        autoFocus
                      >
                        <option value="">Uncategorized</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingCategoryId(tx.id)}
                        className="text-xs px-2 py-1 rounded bg-accent/50 hover:bg-accent text-foreground transition-colors whitespace-nowrap"
                      >
                        {category ? `${category.icon} ${category.name}` : 'Uncategorized'}
                      </button>
                    )}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      tx.transaction_type === 'credit' 
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {tx.transaction_type === 'credit' ? 'CR' : 'DR'}
                    </span>
                  </td>
                  <td className={`p-3 text-right font-semibold whitespace-nowrap ${
                    tx.transaction_type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {tx.transaction_type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-foreground font-medium whitespace-nowrap">
                    {tx.balance ? `₹${tx.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => startEdit(tx)}
                        className="p-1 hover:bg-accent rounded transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4 text-muted-foreground hover:text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete transaction: ${tx.description}?`)) {
                            deleteTransaction(tx.id)
                          }
                        }}
                        className="p-1 hover:bg-accent rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4 text-muted-foreground hover:text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Info & Controls */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-xs text-muted-foreground">
            Showing {transactions.length} of {pagination.total} transactions
          </div>
          
          {pagination.total_pages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-xs font-medium rounded-md border border-border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-foreground">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className="px-3 py-1 text-xs font-medium rounded-md border border-border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
