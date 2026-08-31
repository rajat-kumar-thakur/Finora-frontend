"use client"

/**
 * Add / edit a goal's funding source.
 *
 * Because allocations are only ever edited from inside a goal, this dialog is
 * the one place the user can see that an asset is already spoken for. So it
 * leads with remaining headroom, and refuses to submit a claim that exceeds it.
 */

import { useEffect, useMemo, useState } from 'react'
import { Layers, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  goalApi,
  type AllocationMode,
  type AllocationWrite,
  type AssetSourceWithHeadroom,
} from '@/lib/api/goals'
import { formatCompactINR, formatCurrency, getApiErrorMessage } from '@/lib/utils'

/** Anything under a paisa is float noise, not a claim. */
const CLAIM_EPSILON = 0.01

/**
 * A share as a whole percent. Floors a real-but-tiny share to "<1%" rather than
 * rounding it away to "0%" — these labels exist specifically to stop a claim
 * being under-reported.
 */
function sharePct(p: number): string {
  return p > 0 && p < 0.5 ? '<1%' : `${Math.round(p)}%`
}

/**
 * The one honest line about an asset, short enough for a native <option>.
 *
 * Decides its SHAPE from the amounts and fills in numbers from the percentages.
 * The percentages arrive rounded to 1dp, so 99.96% is already indistinguishable
 * from 100% by the time it gets here — "100% free" has to be a structural claim
 * ("nothing is claimed at all"), never a rounded one.
 *
 * Deliberately does not reconcile to 100%: an over-allocated asset genuinely has
 * shares summing past it, and papering over that is how the picker came to call
 * a fully-claimed FD "100% free".
 */
function headroomSummary(s: AssetSourceWithHeadroom): string {
  if (s.current_value <= 0) return 'no value'

  const mine = s.this_goal_allocated_amount > CLAIM_EPSILON
  const others = s.claimed_by_others_amount > CLAIM_EPSILON
  const free = s.unclaimed_amount > CLAIM_EPSILON

  if (!mine && !others) return '100% free'

  if (mine && !others) {
    return free
      ? `${sharePct(s.this_goal_allocated_percentage)} in this goal · ${sharePct(s.unclaimed_percentage)} free`
      : '100% in this goal'
  }

  if (!mine) {
    return free
      ? `${sharePct(s.unclaimed_percentage)} free · ${sharePct(s.claimed_by_others_percentage)} in other goals`
      : 'fully claimed by other goals'
  }

  // All three in play — terse, because this is the rare case.
  const parts = [
    `${sharePct(s.this_goal_allocated_percentage)} here`,
    `${sharePct(s.claimed_by_others_percentage)} other goals`,
  ]
  if (free) parts.push(`${sharePct(s.unclaimed_percentage)} free`)
  return parts.join(' · ')
}

interface GoalSourcePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  goalId: string
  goalName: string
  /** Pre-select an asset when editing an existing row. */
  editing?: { source_type: string; source_id: string } | null
}

export function GoalSourcePicker({
  open, onOpenChange, onSuccess, goalId, goalName, editing,
}: GoalSourcePickerProps) {
  const [sources, setSources] = useState<AssetSourceWithHeadroom[]>([])
  const [loadingSources, setLoadingSources] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedKey, setSelectedKey] = useState<string>('')
  const [mode, setMode] = useState<AllocationMode>('percent')
  const [value, setValue] = useState<string>('')
  const [applyToClass, setApplyToClass] = useState(false)

  const editingType = editing?.source_type
  const editingId = editing?.source_id

  useEffect(() => {
    if (!open) return

    let cancelled = false
    const load = async () => {
      setLoadingSources(true)
      setError(null)
      try {
        const data = await goalApi.getSources(goalId)
        if (cancelled) return
        setSources(data || [])

        const preset = editingType && editingId
          ? data.find(
              (s) => s.source_type === editingType && s.source_id === editingId,
            )
          : undefined

        if (preset) {
          setSelectedKey(`${preset.source_type}:${preset.source_id}`)
          setMode(preset.this_goal_mode ?? 'percent')
          setValue(
            preset.this_goal_mode === 'amount'
              ? String(preset.this_goal_amount ?? '')
              : String(preset.this_goal_percent ?? ''),
          )
        } else {
          setSelectedKey('')
          setMode('percent')
          setValue('')
        }
        setApplyToClass(false)
      } catch (err: unknown) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load your assets'))
      } finally {
        if (!cancelled) setLoadingSources(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // Depend on primitives, not the `editing` object: the parent re-creates
    // that literal on every render, so depending on it would refetch and wipe
    // whatever the user had typed (the dashboard already ticks every 60s).
  }, [open, goalId, editingType, editingId])

  const selected = useMemo(
    () => sources.find((s) => `${s.source_type}:${s.source_id}` === selectedKey),
    [sources, selectedKey],
  )

  /** Other holdings in the same class that still have room — the bulk-apply set. */
  const classPeers = useMemo(() => {
    if (!selected) return []
    return sources.filter(
      (s) =>
        s.asset_class === selected.asset_class &&
        `${s.source_type}:${s.source_id}` !== selectedKey &&
        s.current_value > 0,
    )
  }, [sources, selected, selectedKey])

  /**
   * Class peers the bulk apply would silently overwrite. Only relevant while
   * "apply to all" is ticked — otherwise nothing but `selected` is written.
   */
  const replacedPeers = useMemo(
    () =>
      applyToClass
        ? classPeers.filter((p) => p.this_goal_allocated_amount > CLAIM_EPSILON)
        : [],
    [applyToClass, classPeers],
  )

  /**
   * Add mode landed on an asset this goal already funds. In edit mode replacing
   * is the intent, so it needs no warning.
   */
  const replacesSelected =
    !editing && !!selected && selected.this_goal_allocated_amount > CLAIM_EPSILON

  const numeric = Number(value)
  const hasValue = value.trim() !== '' && Number.isFinite(numeric) && numeric > 0

  /** What the claim asks for, uncapped — this is what gets validated. */
  const requestedAmount = useMemo(() => {
    if (!selected || !hasValue) return 0
    return mode === 'percent' ? (selected.current_value * numeric) / 100 : numeric
  }, [selected, hasValue, mode, numeric])

  /** What it would currently be worth — capped, and only for display. */
  const previewAmount = selected
    ? Math.min(requestedAmount, selected.current_value)
    : 0

  /**
   * Compare the UNCAPPED request against headroom. Checking the capped figure
   * would let any oversized fixed amount through, since it can never exceed
   * the asset's value — the backend makes the same check for the same reason.
   */
  const overSubscribed = selected
    ? sources.filter((s) => {
        const isTarget =
          `${s.source_type}:${s.source_id}` === selectedKey ||
          (applyToClass && classPeers.some(
            (p) => p.source_id === s.source_id && p.source_type === s.source_type))
        if (!isTarget || !hasValue) return false
        // Percent re-applies per holding; a fixed amount only to the one picked.
        const asked = mode === 'percent'
          ? (s.current_value * numeric) / 100
          : (`${s.source_type}:${s.source_id}` === selectedKey ? numeric : 0)
        return asked > s.available_amount + 0.01
      })
    : []

  const exceedsHeadroom = overSubscribed.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !hasValue) {
      setError('Pick an asset and enter how much of it belongs to this goal')
      return
    }

    const targets = applyToClass ? [selected, ...classPeers] : [selected]

    // A fixed rupee amount cannot sensibly be repeated across every holding in
    // a class — it would claim that amount from each one.
    const allocations: AllocationWrite[] = targets.map((s) => ({
      source_type: s.source_type,
      source_id: s.source_id,
      mode,
      ...(mode === 'percent' ? { percent: numeric } : { amount: numeric }),
    }))

    setSaving(true)
    setError(null)
    try {
      await goalApi.setAllocations(goalId, allocations)
      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to save allocation'))
    } finally {
      setSaving(false)
    }
  }

  // Group the dropdown by asset class so the list reads the way the user thinks.
  const grouped = useMemo(() => {
    const out = new Map<string, AssetSourceWithHeadroom[]>()
    for (const s of sources) {
      const list = out.get(s.asset_class) ?? []
      list.push(s)
      out.set(s.asset_class, list)
    }
    return Array.from(out.entries())
  }, [sources])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit source' : 'Add source'} — {goalName}</DialogTitle>
        </DialogHeader>

        {loadingSources ? (
          <div className="flex items-center gap-2 py-8 justify-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Loading your assets...
          </div>
        ) : sources.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            You have no assets to allocate yet. Add an investment, a fixed deposit
            or a bank account first.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="alert-error">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="source-select">Asset</Label>
              <select
                id="source-select"
                className="input-base w-full"
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                disabled={!!editing}
                required
              >
                <option value="">Select an asset…</option>
                {grouped.map(([assetClass, items]) => (
                  <optgroup key={assetClass} label={assetClass}>
                    {items.map((s) => {
                      const key = `${s.source_type}:${s.source_id}`
                      return (
                        <option
                          key={key}
                          value={key}
                          disabled={s.current_value <= 0}
                        >
                          {s.name} — {formatCompactINR(s.current_value)} · {headroomSummary(s)}
                        </option>
                      )
                    })}
                  </optgroup>
                ))}
              </select>
            </div>

            {selected && (
              <div className="rounded-md border border-border bg-accent/20 px-4 py-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Asset value</span>
                  <span className="font-numeric text-foreground">
                    {formatCurrency(selected.current_value)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Claimed by other goals
                  </span>
                  <span className="font-numeric text-foreground">
                    {formatCurrency(selected.claimed_by_others_amount)}
                    {' '}({sharePct(selected.claimed_by_others_percentage)})
                  </span>
                </div>

                {/* Only shown when there is one. With no claim by this goal,
                    "unclaimed" and "can claim up to" are the same number, and
                    printing it twice is noise. */}
                {selected.this_goal_allocated_amount > CLAIM_EPSILON && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">In this goal already</span>
                      <span className="font-numeric text-foreground">
                        {formatCurrency(selected.this_goal_allocated_amount)}
                        {' '}({sharePct(selected.this_goal_allocated_percentage)})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Unclaimed by any goal</span>
                      <span className="font-numeric text-foreground">
                        {formatCurrency(selected.unclaimed_amount)}
                        {' '}({sharePct(selected.unclaimed_percentage)})
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">This goal can claim up to</span>
                  <span className="font-numeric text-positive">
                    {formatCurrency(selected.available_amount)}
                    {' '}({sharePct(selected.available_percentage)})
                  </span>
                </div>

                {selected.this_goal_allocated_amount > CLAIM_EPSILON && (
                  <p className="text-[11px] text-muted-foreground pt-1.5 mt-1.5 border-t border-border/60">
                    Includes the{' '}
                    <span className="font-numeric">
                      {formatCurrency(selected.this_goal_allocated_amount)}
                    </span>{' '}
                    this goal already holds — saving replaces that claim, it is not
                    added on top.
                  </p>
                )}
              </div>
            )}

            {/* The write is a REPLACE per (goal, asset) — see
                upsert_allocations — so a claim this goal already holds is
                overwritten, not added to. In edit mode that is the whole point,
                but in add mode, and for every peer swept up by "apply to all",
                it would otherwise happen with no warning at all. */}
            {(replacesSelected || replacedPeers.length > 0) && (
              <div className="alert-warning text-sm">
                {replacesSelected && selected ? (
                  <>
                    <span className="font-medium">
                      {goalName} already claims this asset
                    </span>
                    {' — '}
                    {selected.this_goal_mode === 'amount' ? (
                      <>a fixed{' '}
                        <span className="font-numeric">
                          {formatCurrency(selected.this_goal_amount ?? 0)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-numeric">
                          {selected.this_goal_percent ?? 0}%
                        </span>
                        {' '}of it
                      </>
                    )}
                    , worth{' '}
                    <span className="font-numeric">
                      {formatCurrency(selected.this_goal_allocated_amount)}
                    </span>{' '}
                    today. Saving replaces that claim rather than adding to it
                    {replacedPeers.length > 0 && (
                      <>
                        , and does the same to {replacedPeers.length} other holding
                        {replacedPeers.length === 1 ? '' : 's'} in this class
                      </>
                    )}.
                  </>
                ) : (
                  <>
                    <span className="font-medium">
                      Applying to all {selected?.asset_class} replaces existing claims
                    </span>
                    {' — '}
                    {replacedPeers.length} other holding
                    {replacedPeers.length === 1 ? '' : 's'} in this class
                    {replacedPeers.length === 1 ? ' is' : ' are'} already funding
                    {' '}{goalName}, and will be overwritten with this share.
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>How much of it belongs to this goal?</Label>
              <div className="flex gap-2">
                {/* `tab-pill` carries the sizing; -active/-inactive are modifiers. */}
                <div className="tab-pill-container flex-shrink-0">
                  <button
                    type="button"
                    className={`tab-pill ${mode === 'percent' ? 'tab-pill-active' : 'tab-pill-inactive'}`}
                    onClick={() => { setMode('percent'); setValue('') }}
                  >
                    Percent
                  </button>
                  <button
                    type="button"
                    className={`tab-pill ${mode === 'amount' ? 'tab-pill-active' : 'tab-pill-inactive'}`}
                    onClick={() => { setMode('amount'); setValue(''); setApplyToClass(false) }}
                  >
                    Fixed ₹
                  </button>
                </div>
                <Input
                  type="number"
                  min="0"
                  // "any": a stepped value makes HTML5 validation silently
                  // refuse 12.5% or an FD worth ₹1,50,500.
                  step="any"
                  max={mode === 'percent' ? 100 : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={mode === 'percent' ? '40' : '200000'}
                  className="flex-1"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {mode === 'percent'
                  ? 'Moves with the asset — if it grows, this goal grows too.'
                  : 'Stays put — the asset can grow without changing this goal.'}
              </p>
            </div>

            {/* Bulk apply. Only offered for percentages: repeating a fixed rupee
                amount across a class would claim that amount from each holding. */}
            {mode === 'percent' && classPeers.length > 0 && (
              <label className="flex items-start gap-2 rounded-md border border-border bg-card px-3 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={applyToClass}
                  onChange={(e) => setApplyToClass(e.target.checked)}
                />
                <span className="text-xs">
                  <span className="flex items-center gap-1.5 text-foreground font-medium">
                    <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                    Apply to all {selected?.asset_class}
                  </span>
                  <span className="text-muted-foreground">
                    Also allocates {hasValue ? `${numeric}%` : 'this share'} of the
                    other {classPeers.length} holding{classPeers.length === 1 ? '' : 's'}
                    {' '}in this class.
                  </span>
                </span>
              </label>
            )}

            {selected && hasValue && (
              <div className="rounded-md border border-border bg-accent/20 px-4 py-3">
                <div className="text-xs text-muted-foreground">
                  {applyToClass ? `Allocated from ${selected.name}` : 'Allocated to this goal'}
                </div>
                <div className="text-lg font-bold text-foreground font-numeric">
                  {formatCurrency(previewAmount)}
                </div>
                {exceedsHeadroom && (
                  <div className="text-xs text-negative mt-1">
                    {overSubscribed.length === 1 ? (
                      <>
                        Exceeds the {formatCurrency(overSubscribed[0].available_amount)}
                        {' '}still free on {overSubscribed[0].name}.
                      </>
                    ) : (
                      <>
                        Too much for {overSubscribed.length} holdings in this class,
                        including {overSubscribed[0].name} (only
                        {' '}{formatCurrency(overSubscribed[0].available_amount)} free).
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || exceedsHeadroom}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
