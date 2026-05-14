"use client"

/**
 * Account Selector
 *
 * Reusable dropdown for choosing a bank account. Fetches the user's accounts
 * on mount and surfaces them in a plain <select> styled to match the existing
 * modals (consistent with transaction-create-modal.tsx).
 *
 * - When `includeAllOption` is true, an "All Accounts" sentinel is rendered
 *   (value = ""). Useful for filter contexts.
 * - When `includeAllOption` is false (default) and `value` is undefined,
 *   the selector auto-defaults to the user's primary account on first load.
 */

import { useEffect, useState } from 'react'
import { bankAccountApi, type BankAccount } from '@/lib/api/bank-accounts'

interface AccountSelectorProps {
  value: string | undefined
  onChange: (accountId: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  includeAllOption?: boolean
  className?: string
  /** Optional id for label association */
  id?: string
}

export function AccountSelector({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  includeAllOption = false,
  className,
  id,
}: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await bankAccountApi.list()
        if (cancelled) return
        setAccounts(data)
        if (!includeAllOption && value === undefined && data.length > 0) {
          const primary = data.find((a) => a.is_primary) ?? data[0]
          onChange(primary.id)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load accounts')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeAllOption])

  const selectId = id ?? 'account-selector'

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value ?? (includeAllOption ? '' : '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading || (!includeAllOption && accounts.length === 0)}
        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground disabled:opacity-50"
        title={label ?? 'Select bank account'}
      >
        {includeAllOption && <option value="">All Accounts</option>}
        {!includeAllOption && accounts.length === 0 && (
          <option value="">{placeholder ?? 'No accounts yet — add one in Accounts'}</option>
        )}
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.is_primary ? '⭐ ' : ''}
            {acc.name}
            {acc.account_number_last4 ? ` ••${acc.account_number_last4}` : ''}
            {acc.bank_name && acc.bank_name !== 'Other' ? ` (${acc.bank_name})` : ''}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  )
}
