"use client"

/**
 * Dashboard Goals widget.
 *
 * Leads with the allocated / unallocated split, then the goals themselves with
 * their progress. Deliberately compact — the full view lives at /goals.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Flag } from 'lucide-react'

import { goalIcon } from '@/components/goal-card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  GOAL_STATUS_BADGE,
  GOAL_STATUS_BAR,
  GOAL_STATUS_LABEL,
  goalApi,
  goalColorClasses,
  type Goal,
  type GoalsOverview,
} from '@/lib/api/goals'
import { Badge } from '@/components/ui/badge'
import { formatCompactINR } from '@/lib/utils'

const MAX_GOALS_SHOWN = 4

export function GoalsOverviewCard({ refreshTrigger }: { refreshTrigger?: number } = {}) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [overview, setOverview] = useState<GoalsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [goalData, overviewData] = await Promise.all([
          goalApi.getAll(),
          goalApi.getOverview(),
        ])
        setGoals(goalData || [])
        setOverview(overviewData)
      } catch {
        // Match the other dashboard widgets: a failure here must not take the
        // dashboard down, so fall back to the empty state.
        setGoals([])
        setOverview(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshTrigger])

  if (loading) {
    return (
      <div className="card-base card-padding space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  const shown = goals.slice(0, MAX_GOALS_SHOWN)

  return (
    <div className="card-base card-padding">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm sm:text-base font-semibold text-foreground">Goals</h2>
        </div>
        <Link href="/goals" className="text-xs text-primary hover:text-primary/80">
          {goals.length > 0 ? 'View All →' : 'Set up →'}
        </Link>
      </div>

      {/* Allocated vs unallocated — the headline distinction */}
      {overview && overview.total_allocatable > 0 && (
        <div className="mb-4">
          <div className="flex items-end justify-between gap-3 mb-2">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                Allocated to Goals
              </div>
              <div className="text-xl font-semibold text-foreground font-numeric">
                {formatCompactINR(overview.total_allocated)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                Unallocated
              </div>
              <div className="text-xl font-semibold text-muted-foreground font-numeric">
                {formatCompactINR(overview.total_unallocated)}
              </div>
            </div>
          </div>
          <Progress
            value={Math.min(overview.allocated_percentage, 100)}
            indicatorClassName="bg-primary"
            aria-label="Share of wealth allocated to goals"
          />
          <div className="text-xs text-muted-foreground font-numeric mt-1">
            {overview.allocated_percentage.toFixed(0)}% of{' '}
            {formatCompactINR(overview.total_allocatable)} allocatable wealth
          </div>
        </div>
      )}

      {/* Goals */}
      {goals.length === 0 ? (
        <Link href="/goals" className="block">
          <div className="p-3 bg-accent/30 rounded-lg border border-dashed border-border text-center hover:bg-accent transition-colors">
            <div className="text-xs text-muted-foreground">No goals yet</div>
            <div className="text-xs text-primary mt-1">
              + Earmark your money for what it&apos;s for
            </div>
          </div>
        </Link>
      ) : (
        <div className="space-y-2">
          {shown.map((goal) => {
            const Icon = goalIcon(goal.icon)
            const accent = goalColorClasses(goal.color)
            const pct = goal.progress_percentage ?? 0

            return (
              <Link href={`/goals/${goal.id}`} key={goal.id} className="block card-interactive">
                <div className="p-3 bg-accent/50 rounded-lg border border-border hover:bg-accent transition-all duration-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent.bg}`}
                      >
                        <Icon className={`w-4 h-4 ${accent.text}`} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                          {goal.name}
                          {(goal.has_over_allocated_source || goal.has_stale_source) && (
                            <AlertTriangle
                              className="w-3 h-3 text-warning flex-shrink-0"
                              aria-label="Needs attention"
                            />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate font-numeric">
                          {formatCompactINR(goal.allocated_amount)}
                          {goal.target_amount !== null &&
                            ` / ${formatCompactINR(goal.target_amount)}`}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={GOAL_STATUS_BADGE[goal.track_status]}
                      className="flex-shrink-0"
                    >
                      {GOAL_STATUS_LABEL[goal.track_status]}
                    </Badge>
                  </div>

                  {goal.target_amount !== null && (
                    <Progress
                      value={Math.min(pct, 100)}
                      indicatorClassName={GOAL_STATUS_BAR[goal.track_status]}
                      className="h-1.5"
                      aria-label={`${goal.name} progress`}
                    />
                  )}
                </div>
              </Link>
            )
          })}

          {goals.length > MAX_GOALS_SHOWN && (
            <Link
              href="/goals"
              className="block text-center text-xs text-primary hover:text-primary/80 pt-1"
            >
              +{goals.length - MAX_GOALS_SHOWN} more
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
