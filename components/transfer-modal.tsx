"use client"

/**
 * Transfer Modal
 *
 * Records an inter-account transfer as a linked debit/credit pair.
 * The pair is excluded from cumulative income/expense aggregates server-side
 * but still contributes to each account's running balance.
 */

import { useEffect, useState } from 'react'
import { transactionApi } from '@/lib/api'
import { bankAccountApi, type BankAccount } from '@/lib/api/bank-accounts'

interface TransferModalProps {
  onClose: () => void
  onSaved: () => void
  /** Optional pre-selected source account */
  defaultFromAccountId?: string
}

export function TransferModal({ onClose, onSaved, defaultFromAccountId }: TransferModalProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [fromAccountId, setFromAccountId] = useState<string>(defaultFromAccountId ?? '')
  const [toAccountId, setToAccountId] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState<string>('')
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoadingAccounts(true)
      try {
        const data = await bankAccountApi.list()
        if (cancelled) return
        setAccounts(data)
        if (!fromAccountId) {
          const primary = data.find((a) => a.is_primary) ?? data[0]
          if (primary) setFromAccountId(primary.id)
        }
        // Pick a sensible default destination — the first account that isn't the source
        if (!toAccountId) {
          const dest = data.find((a) => a.id !== (defaultFromAccountId ?? data.find((b) => b.is_primary)?.id ?? data[0]?.id))
          if (dest) setToAccountId(dest.id)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load accounts')
      } finally {
        if (!cancelled) setLoadingAccounts(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fromAccount = accounts.find((a) => a.id === fromAccountId)
  const toAccount = accounts.find((a) => a.id === toAccountId)
  const parsedAmount = parseFloat(amount)
  const insufficient =
    fromAccount &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    fromAccount.current_balance < parsedAmount

  const canSubmit =
    !!fromAccountId &&
    !!toAccountId &&
    fromAccountId !== toAccountId &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    !!date

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    try {
      await transactionApi.transfer({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: parsedAmount,
        date,
        description: description.trim() || undefined,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record transfer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Transfer Between Accounts</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Moves money between your own accounts. Not counted as income or expense.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {loadingAccounts ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : accounts.length < 2 ? (
            <div className="bg-accent/30 border border-border rounded-lg p-3">
              <p className="text-sm text-foreground">
                You need at least two bank accounts to record a transfer.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add another account from the Accounts page.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="tr-from" className="block text-sm font-medium text-foreground mb-1">
                  From
                </label>
                <select
                  id="tr-from"
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  title="Source account"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === toAccountId}>
                      {acc.is_primary ? '⭐ ' : ''}{acc.name} — ₹{acc.current_balance.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tr-to" className="block text-sm font-medium text-foreground mb-1">
                  To
                </label>
                <select
                  id="tr-to"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  title="Destination account"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>
                      {acc.is_primary ? '⭐ ' : ''}{acc.name} — ₹{acc.current_balance.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tr-amount" className="block text-sm font-medium text-foreground mb-1">
                  Amount
                </label>
                <input
                  id="tr-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
                {insufficient && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Heads up: amount exceeds the source account&apos;s current balance.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="tr-date" className="block text-sm font-medium text-foreground mb-1">
                  Date
                </label>
                <input
                  id="tr-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>

              <div>
                <label htmlFor="tr-desc" className="block text-sm font-medium text-foreground mb-1">
                  Description (optional)
                </label>
                <input
                  id="tr-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  placeholder={
                    fromAccount && toAccount
                      ? `Transfer from ${fromAccount.name} to ${toAccount.name}`
                      : 'Anything to remember about this transfer'
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit || saving || loadingAccounts || accounts.length < 2}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Recording…' : 'Record Transfer'}
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
