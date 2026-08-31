"use client"

/**
 * Goals index: what your money is spoken for, and what is not.
 *
 * The three tiles at the top are the whole point of the feature — allocatable
 * wealth split into "claimed by a goal" and "unallocated long-term wealth".
 * The unallocated figure is a pure residual; there is nothing to maintain.
 */

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Flag, Plus } from 'lucide-react'

import { GoalCard } from '@/components/goal-card'
import { GoalForm } from '@/components/goal-form'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { goalApi, type Goal, type GoalsOverview } from '@/lib/api/goals'
import { formatCompactINR, formatCurrency, getApiErrorMessage } from '@/lib/utils'

export function GoalList() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [overview, setOverview] = useState<GoalsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  // `cancelled` guards against a slow earlier request landing after a newer
  // one — easy to trigger by toggling "Show archived" twice quickly.
  const load = useCallback(async (isCancelled?: () => boolean) => {
    setError(null)
    try {
      const [goalData, overviewData] = await Promise.all([
        goalApi.getAll(showArchived),
        goalApi.getOverview(),
      ])
      if (isCancelled?.()) return
      setGoals(goalData || [])
      setOverview(overviewData)
    } catch (err: unknown) {
      if (isCancelled?.()) return
      setError(getApiErrorMessage(err, 'Failed to load goals'))
      setGoals([])
    } finally {
      if (!isCancelled?.()) setLoading(false)
    }
  }, [showArchived])

  useEffect(() => {
    let cancelled = false
    load(() => cancelled)
    return () => { cancelled = true }
  }, [load])

  if (loading) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="stat-card space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>
        <div className="grid-cards">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-base card-padding space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {error && <div className="alert-error">{error}</div>}

      {/* Allocated vs unallocated */}
      {overview && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="stat-card">
              <div className="stat-label">Allocatable Wealth</div>
              <div className="stat-value font-numeric">
                {formatCompactINR(overview.total_allocatable)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Investments and active deposits
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Allocated to Goals</div>
              <div className="stat-value font-numeric text-primary">
                {formatCompactINR(overview.total_allocated)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-numeric">
                {overview.allocated_percentage.toFixed(0)}% of your wealth
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Unallocated</div>
              <div className="stat-value font-numeric">
                {formatCompactINR(overview.total_unallocated)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Long-term wealth, not earmarked
              </div>
            </div>
          </div>

          {overview.total_allocatable > 0 && (
            <Progress
              value={Math.min(overview.allocated_percentage, 100)}
              indicatorClassName="bg-primary"
              aria-label="Share of wealth allocated to goals"
            />
          )}
        </div>
      )}

      {/* Drift warnings. Saves are blocked when they would over-allocate, so
          anything here was caused by a value change after the fact. */}
      {overview && overview.over_allocated_sources.length > 0 && (
        <div className="alert-warning">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="text-sm">
              <div className="font-medium">
                {overview.over_allocated_sources.length} asset
                {overview.over_allocated_sources.length === 1 ? ' is' : 's are'} over-allocated
              </div>
              <ul className="mt-1 space-y-0.5 text-xs">
                {overview.over_allocated_sources.map((s) => (
                  <li key={`${s.source_type}:${s.source_id}`}>
                    <span className="font-medium">{s.name}</span> is worth{' '}
                    <span className="font-numeric">{formatCurrency(s.current_value)}</span>{' '}
                    but {s.claimed_percentage.toFixed(0)}% claimed by{' '}
                    {s.goal_names.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Goals */}
      <div className="card-base card-padding">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Your Goals</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              aria-pressed={showArchived}
              className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                showArchived
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border hover:bg-accent text-muted-foreground'
              }`}
            >
              {showArchived ? 'Hide archived' : 'Show archived'}
            </button>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              New Goal
            </Button>
          </div>
        </div>

        {goals.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="No goals yet"
            body="Create a goal, then allocate a share of the assets you already own toward it. Nothing is moved or duplicated — it's just a label on money you already have."
          >
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              Create your first goal
            </Button>
          </EmptyState>
        ) : (
          <div className="grid-cards">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>

      <GoalForm open={formOpen} onOpenChange={setFormOpen} onSuccess={() => load()} />
    </div>
  )
}
