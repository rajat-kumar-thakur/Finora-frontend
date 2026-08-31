"use client"

/**
 * A single goal: how it is funded, by what, and whether that keeps pace.
 *
 * This is also the only place allocations are edited — there is no asset-wide
 * editor — so the "add source" flow lives here and leans on the picker to show
 * each asset's remaining headroom.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, Archive, ArchiveRestore, ArrowLeft, Layers, Pencil, Plus, Trash2,
} from 'lucide-react'

import { goalIcon } from '@/components/goal-card'
import { GoalForm } from '@/components/goal-form'
import { GoalSourcePicker } from '@/components/goal-source-picker'
import { GoalSourceTable } from '@/components/goal-source-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  GOAL_STATUS_BADGE,
  GOAL_STATUS_BAR,
  GOAL_STATUS_LABEL,
  goalApi,
  goalColorClasses,
  type GoalDetail,
  type GoalSourceRow,
} from '@/lib/api/goals'
import { formatCompactINR, formatCurrency, getApiErrorMessage } from '@/lib/utils'

function formatFullDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function GoalDetailView({ goalId }: { goalId: string }) {
  const router = useRouter()
  const [goal, setGoal] = useState<GoalDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<GoalSourceRow | null>(null)
  const [removingSource, setRemovingSource] = useState<GoalSourceRow | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // `isCancelled` stops a superseded response from overwriting a newer one.
  const load = useCallback(async (isCancelled?: () => boolean) => {
    setError(null)
    try {
      const data = await goalApi.getById(goalId)
      if (isCancelled?.()) return
      setGoal(data)
    } catch (err: unknown) {
      if (isCancelled?.()) return
      setError(getApiErrorMessage(err, 'Failed to load goal'))
    } finally {
      if (!isCancelled?.()) setLoading(false)
    }
  }, [goalId])

  useEffect(() => {
    let cancelled = false
    load(() => cancelled)
    return () => { cancelled = true }
  }, [load])

  const handleRemoveSource = async () => {
    if (!removingSource) return
    try {
      await goalApi.removeAllocation(
        goalId, removingSource.source_type, removingSource.source_id,
      )
      setRemovingSource(null)
      await load()
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to remove source'))
      setRemovingSource(null)
    }
  }

  /** Archive keeps the goal and its allocations but hides it from the list. */
  const handleToggleArchive = async () => {
    if (!goal) return
    try {
      await goalApi.update(goal.id, {
        status: goal.status === 'archived' ? 'active' : 'archived',
      })
      await load()
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to update goal'))
    }
  }

  const handleDeleteGoal = async () => {
    try {
      await goalApi.delete(goalId)
      router.push('/goals')
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to delete goal'))
      setDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="card-base card-padding space-y-3">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="card-base card-padding space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="space-y-4">
        {error && <div className="alert-error">{error}</div>}
        <EmptyState icon={AlertTriangle} title="Goal not found">
          <Link href="/goals" className="btn-secondary">Back to goals</Link>
        </EmptyState>
      </div>
    )
  }

  const Icon = goalIcon(goal.icon)
  const accent = goalColorClasses(goal.color)
  const pct = goal.progress_percentage ?? 0

  return (
    <div className="space-y-4 lg:space-y-6">
      {error && <div className="alert-error">{error}</div>}

      <Link
        href="/goals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        All goals
      </Link>

      {/* Header */}
      <div className="card-base card-padding lg:p-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${accent.bg}`}
            >
              <Icon className={`w-6 h-6 ${accent.text}`} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{goal.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={GOAL_STATUS_BADGE[goal.track_status]}>
                  {GOAL_STATUS_LABEL[goal.track_status]}
                </Badge>
                {goal.status === 'archived' && (
                  <Badge variant="secondary">Archived</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} aria-label="Edit goal">
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleArchive}
              aria-label={goal.status === 'archived' ? 'Restore goal' : 'Archive goal'}
              title={goal.status === 'archived' ? 'Restore goal' : 'Archive goal'}
            >
              {goal.status === 'archived'
                ? <ArchiveRestore className="w-4 h-4" />
                : <Archive className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} aria-label="Delete goal">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="stat-hero">{formatCompactINR(goal.allocated_amount)}</span>
          {goal.target_amount !== null && (
            <span className="text-lg text-muted-foreground font-numeric">
              / {formatCompactINR(goal.target_amount)} ({pct.toFixed(0)}%)
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-numeric mt-1">
          {formatCurrency(goal.allocated_amount)} allocated
          {goal.target_amount !== null && ` of ${formatCurrency(goal.target_amount)}`}
        </div>

        {goal.target_amount !== null && (
          <div className="mt-4 space-y-2">
            <Progress
              value={Math.min(pct, 100)}
              indicatorClassName={GOAL_STATUS_BAR[goal.track_status]}
              className="h-2.5"
              aria-label="Funding progress"
            />
            {goal.elapsed_percentage !== null && (
              <div className="flex items-center justify-between text-xs text-muted-foreground font-numeric">
                <span>{pct.toFixed(0)}% funded</span>
                <span>{goal.elapsed_percentage.toFixed(0)}% of the time elapsed</span>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <div className="p-3 bg-accent/40 rounded-lg border border-border">
            <div className="stat-label">Target</div>
            <div className="text-sm font-semibold text-foreground font-numeric mt-1">
              {goal.target_amount !== null ? formatCompactINR(goal.target_amount) : 'Flexible'}
            </div>
          </div>
          <div className="p-3 bg-accent/40 rounded-lg border border-border">
            <div className="stat-label">Remaining</div>
            <div className="text-sm font-semibold text-foreground font-numeric mt-1">
              {goal.remaining_amount !== null ? formatCompactINR(goal.remaining_amount) : '—'}
            </div>
          </div>
          <div className="p-3 bg-accent/40 rounded-lg border border-border">
            <div className="stat-label">Target Date</div>
            <div className="text-sm font-semibold text-foreground mt-1">
              {formatFullDate(goal.target_date)}
            </div>
            {goal.days_remaining !== null && (
              <div className="text-xs text-muted-foreground font-numeric">
                {goal.days_remaining < 0
                  ? `${Math.abs(goal.days_remaining)} days overdue`
                  : `${goal.days_remaining} days left`}
              </div>
            )}
          </div>
          <div className="p-3 bg-accent/40 rounded-lg border border-border">
            <div className="stat-label">Needed / Month</div>
            <div className="text-sm font-semibold text-foreground font-numeric mt-1">
              {goal.required_monthly !== null && goal.required_monthly > 0
                ? formatCompactINR(goal.required_monthly)
                : '—'}
            </div>
          </div>
        </div>

        {goal.notes && (
          <p className="text-sm text-muted-foreground mt-4 border-t border-border pt-4">
            {goal.notes}
          </p>
        )}
      </div>

      {/* Warnings */}
      {goal.has_over_allocated_source && (
        <div className="alert-warning text-sm">
          One or more assets funding this goal are claimed for more than they are
          currently worth. This happens when an asset falls in value after it was
          allocated — reduce a share below to clear it.
        </div>
      )}
      {goal.has_stale_source && (
        <div className="alert-warning text-sm">
          This goal references an asset that no longer exists. Remove the stale
          row below to tidy it up.
        </div>
      )}

      {/* Sources */}
      <div className="card-base card-padding">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Funded by</h2>
            <p className="section-subtitle">
              A share of assets you already own — nothing here is a separate account
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => { setEditingSource(null); setPickerOpen(true) }}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add source
          </Button>
        </div>

        {goal.sources.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No sources yet"
            body="Allocate a percentage or a fixed amount of an existing asset toward this goal."
          >
            <Button
              size="sm"
              onClick={() => { setEditingSource(null); setPickerOpen(true) }}
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add your first source
            </Button>
          </EmptyState>
        ) : (
          <>
            <GoalSourceTable
              sources={goal.sources}
              coverage={goal.class_coverage}
              onEdit={(row) => { setEditingSource(row); setPickerOpen(true) }}
              onRemove={(row) => setRemovingSource(row)}
            />
            <div className="flex items-center justify-between border-t border-border mt-2 pt-3 text-sm">
              <span className="text-muted-foreground">Total allocated</span>
              <span className="font-numeric font-semibold text-foreground">
                {formatCurrency(goal.allocated_amount)}
              </span>
            </div>
            {goal.remaining_amount !== null && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Still to fund</span>
                <span className="font-numeric text-foreground">
                  {formatCurrency(goal.remaining_amount)}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <GoalForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => load()}
        goal={goal}
      />

      <GoalSourcePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSuccess={() => load()}
        goalId={goal.id}
        goalName={goal.name}
        editing={
          editingSource
            ? { source_type: editingSource.source_type, source_id: editingSource.source_id }
            : null
        }
      />

      <ConfirmDialog
        open={!!removingSource}
        onOpenChange={(open) => { if (!open) setRemovingSource(null) }}
        title="Remove this source?"
        description={
          removingSource
            ? `${removingSource.name} will no longer fund ${goal.name}. The asset itself is not affected.`
            : ''
        }
        confirmLabel="Remove"
        onConfirm={handleRemoveSource}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${goal.name}"?`}
        description="The goal and all of its allocations are removed. Your assets are not affected."
        confirmLabel="Delete"
        onConfirm={handleDeleteGoal}
      />
    </div>
  )
}
