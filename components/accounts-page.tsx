"use client"

/**
 * Accounts Page
 *
 * Manage bank accounts: list, add, edit, set primary, delete.
 */

import { useEffect, useState } from 'react'
import {
  bankAccountApi,
  type BankAccount,
  type BankAccountCreate,
  type BankAccountUpdate,
} from '@/lib/api/bank-accounts'
import { INDIAN_BANKS } from '@/lib/constants/indian-banks'
import { formatCurrency } from '@/lib/utils'
import { TransferModal } from '@/components/transfer-modal'

type ModalMode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; account: BankAccount }

export function AccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalMode>({ kind: 'closed' })
  const [transferOpen, setTransferOpen] = useState(false)
  const [actioningId, setActioningId] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await bankAccountApi.list()
      setAccounts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPrimary = async (id: string) => {
    setActioningId(id)
    try {
      await bankAccountApi.setPrimary(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary')
    } finally {
      setActioningId(null)
    }
  }

  const handleDelete = async (acc: BankAccount) => {
    if (!confirm(`Delete account "${acc.name}"? This cannot be undone.`)) return
    setActioningId(acc.id)
    setError(null)
    try {
      await bankAccountApi.delete(acc.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setActioningId(null)
    }
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0)

  return (
    <div className="page-container">
      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Bank Accounts</h1>
          <p className="page-subtitle">
            Manage your accounts. Transactions and uploads are scoped to a single account.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTransferOpen(true)}
            disabled={accounts.length < 2}
            className="px-4 py-2 border border-border text-foreground rounded-md text-sm font-medium hover:bg-accent disabled:opacity-50"
            title={accounts.length < 2 ? 'Add a second account to enable transfers' : undefined}
          >
            ↔ Transfer
          </button>
          <button
            onClick={() => setModal({ kind: 'create' })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            + Add Account
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Total */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="text-xs text-muted-foreground">Cumulative balance across all accounts</div>
        <div className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalBalance)}</div>
        <div className="text-xs text-muted-foreground mt-1">{accounts.length} account{accounts.length === 1 ? '' : 's'}</div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">🏦</div>
          <p className="text-sm text-foreground">No bank accounts yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add your first account to start tracking balances and transactions.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-card border border-border rounded-xl p-4 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{acc.name}</span>
                    {acc.is_primary && (
                      <span className="text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {acc.bank_name}
                    {acc.account_number_last4 ? ` • ••${acc.account_number_last4}` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground whitespace-nowrap">
                    {formatCurrency(acc.current_balance)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {acc.transaction_count} txn{acc.transaction_count === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              {acc.notes && (
                <div className="text-xs text-muted-foreground mt-3 line-clamp-2">{acc.notes}</div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border/60">
                <button
                  onClick={() => setModal({ kind: 'edit', account: acc })}
                  disabled={actioningId === acc.id}
                  className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
                >
                  Edit
                </button>
                {!acc.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(acc.id)}
                    disabled={actioningId === acc.id}
                    className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  onClick={() => handleDelete(acc)}
                  disabled={actioningId === acc.id}
                  className="text-xs px-3 py-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.kind !== 'closed' && (
        <AccountModal
          mode={modal}
          onClose={() => setModal({ kind: 'closed' })}
          onSaved={async () => {
            setModal({ kind: 'closed' })
            await load()
          }}
        />
      )}

      {transferOpen && (
        <TransferModal
          onClose={() => setTransferOpen(false)}
          onSaved={async () => {
            setTransferOpen(false)
            await load()
          }}
        />
      )}
    </div>
  )
}

interface AccountModalProps {
  mode: { kind: 'create' } | { kind: 'edit'; account: BankAccount }
  onClose: () => void
  onSaved: () => Promise<void> | void
}

function AccountModal({ mode, onClose, onSaved }: AccountModalProps) {
  const initial = mode.kind === 'edit' ? mode.account : null
  const [name, setName] = useState(initial?.name ?? '')
  const [bankName, setBankName] = useState(initial?.bank_name ?? INDIAN_BANKS[0])
  const [last4, setLast4] = useState(initial?.account_number_last4 ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (mode.kind === 'create') {
        const payload: BankAccountCreate = {
          name: name.trim(),
          bank_name: bankName,
          account_number_last4: last4.trim() || null,
          notes: notes.trim() || null,
        }
        await bankAccountApi.create(payload)
      } else {
        const payload: BankAccountUpdate = {
          name: name.trim(),
          bank_name: bankName,
          account_number_last4: last4.trim() || null,
          notes: notes.trim() || null,
        }
        await bankAccountApi.update(mode.account.id, payload)
      }
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {mode.kind === 'create' ? 'Add Bank Account' : 'Edit Bank Account'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="acc-name" className="block text-sm font-medium text-foreground mb-1">
              Account Name
            </label>
            <input
              id="acc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
              placeholder="e.g. HDFC Salary"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            />
          </div>

          <div>
            <label htmlFor="acc-bank" className="block text-sm font-medium text-foreground mb-1">
              Bank
            </label>
            <select
              id="acc-bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              title="Select bank"
            >
              {INDIAN_BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="acc-last4" className="block text-sm font-medium text-foreground mb-1">
              Account Number (last 4 digits, optional)
            </label>
            <input
              id="acc-last4"
              type="text"
              value={last4 ?? ''}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              inputMode="numeric"
              placeholder="1234"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            />
          </div>

          <div>
            <label htmlFor="acc-notes" className="block text-sm font-medium text-foreground mb-1">
              Notes (optional)
            </label>
            <textarea
              id="acc-notes"
              value={notes ?? ''}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Anything to remember about this account"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground resize-y"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : mode.kind === 'create' ? 'Add Account' : 'Save'}
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
