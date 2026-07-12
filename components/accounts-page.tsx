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
import { ArrowLeftRight, Plus, Landmark } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type ModalMode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; account: BankAccount }

export function AccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalMode>({ kind: 'closed' })
  const [transferOpen, setTransferOpen] = useState(false)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<BankAccount | null>(null)

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
            className="btn-outline"
            title="Transfer between accounts"
          >
            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            Transfer
          </button>
          <button
            onClick={() => setModal({ kind: 'create' })}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Account
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-error">{error}</div>
      )}

      {/* Total */}
      <div className="stat-card">
        <div className="stat-label">Cumulative balance across all accounts</div>
        <div className="stat-value font-numeric">{formatCurrency(totalBalance)}</div>
        <div className="text-xs text-muted-foreground mt-1 font-numeric">{accounts.length} account{accounts.length === 1 ? '' : 's'}</div>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No bank accounts yet"
          body="Add your first account to start tracking balances and transactions."
        >
          <button className="btn-primary" onClick={() => setModal({ kind: 'create' })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Account
          </button>
        </EmptyState>
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
                      <span className="badge-primary">
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
                  <div className="text-sm font-semibold text-foreground whitespace-nowrap font-numeric">
                    {formatCurrency(acc.current_balance)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
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
                  className="btn-outline text-xs px-3 py-1.5"
                >
                  Edit
                </button>
                {!acc.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(acc.id)}
                    disabled={actioningId === acc.id}
                    className="btn-outline text-xs px-3 py-1.5"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  onClick={() => setConfirmTarget(acc)}
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

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(o) => { if (!o) setConfirmTarget(null) }}
        title="Delete account?"
        description={
          confirmTarget
            ? `Delete account "${confirmTarget.name}"? This cannot be undone.`
            : undefined
        }
        onConfirm={() => { if (confirmTarget) handleDelete(confirmTarget) }}
      />
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in-0">
      <div className="bg-popover rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-border animate-in fade-in-0 zoom-in-95">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {mode.kind === 'create' ? 'Add Bank Account' : 'Edit Bank Account'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="alert-error">{error}</div>
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
              className="input-sm"
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
              className="input-sm"
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
              className="input-sm"
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
              className="input-sm resize-y"
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
