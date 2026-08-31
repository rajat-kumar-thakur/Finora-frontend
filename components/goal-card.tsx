"use client"

/**
 * Goal Card
 *
 * One goal at a glance: how much of it is funded, whether that keeps pace with
 * its deadline, and what it would take per month to close the gap.
 */

import Link from 'next/link'
import {
  AlertTriangle, Baby, Briefcase, Car, Gift, GraduationCap, Heart, Home,
  PiggyBank, Plane, Shield, Sparkles, Target, type LucideIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  GOAL_STATUS_BADGE,
  GOAL_STATUS_BAR,
  GOAL_STATUS_LABEL,
  goalColorClasses,
  type Goal,
} from '@/lib/api/goals'
import { formatCompactINR } from '@/lib/utils'

/**
 * The curated icon set, imported by name so the bundler can tree-shake.
 * Mirrors GOAL_ICONS in lib/api/goals.ts, which the backend also validates against.
 */
export const GOAL_ICON_MAP: Record<string, LucideIcon> = {
  Target, Home, Car, Plane, GraduationCap, Heart,
  Shield, Gift, Briefcase, Baby, PiggyBank, Sparkles,
}

export function goalIcon(name: string): LucideIcon {
  return GOAL_ICON_MAP[name] ?? Target
}

export function formatTargetDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

/** "in 8 months" / "3 months ago" — friendlier than a raw day count. */
export function formatDeadline(goal: Goal): string | null {
  const target = formatTargetDate(goal.target_date)
  if (!target) return null

  const days = goal.days_remaining
  if (days === null || days === undefined) return target
  if (days < 0) return `${target} · overdue`
  if (days === 0) return `${target} · today`
  if (days < 45) return `${target} · ${days}d left`

  const months = Math.round(days / 30.44)
  if (months < 18) return `${target} · ${months} months left`
  return `${target} · ${(days / 365).toFixed(1)} years left`
}

export function GoalCard({ goal }: { goal: Goal }) {
  const Icon = goalIcon(goal.icon)
  const accent = goalColorClasses(goal.color)
  const deadline = formatDeadline(goal)
  const pct = goal.progress_percentage ?? 0

  return (
    <Link href={`/goals/${goal.id}`} className="block card-interactive">
      <div
        className={`card-base card-padding h-full flex flex-col gap-3 ${
          goal.status === 'archived' ? 'opacity-60' : ''
        }`}
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent.bg}`}
            >
              <Icon className={`w-5 h-5 ${accent.text}`} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{goal.name}</div>
              {deadline && (
                <div className="text-xs text-muted-foreground truncate">{deadline}</div>
              )}
            </div>
          </div>
          {goal.status === 'archived' ? (
            <Badge variant="secondary" className="flex-shrink-0">Archived</Badge>
          ) : (
            <Badge variant={GOAL_STATUS_BADGE[goal.track_status]} className="flex-shrink-0">
              {GOAL_STATUS_LABEL[goal.track_status]}
            </Badge>
          )}
        </div>

        {/* Amounts */}
        <div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="stat-value font-numeric">
              {formatCompactINR(goal.allocated_amount)}
            </span>
            {goal.target_amount !== null && (
              <span className="text-sm text-muted-foreground font-numeric">
                / {formatCompactINR(goal.target_amount)}
              </span>
            )}
          </div>
          {goal.target_amount === null && (
            <div className="text-xs text-muted-foreground mt-0.5">
              Flexible — no target set
            </div>
          )}
        </div>

        {/* Progress. A flexible goal has nothing to be a fraction of. */}
        {goal.target_amount !== null && (
          <div className="space-y-1.5">
            <Progress
              value={Math.min(pct, 100)}
              indicatorClassName={GOAL_STATUS_BAR[goal.track_status]}
              aria-label={`${goal.name} funding progress`}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-numeric">
                {pct.toFixed(0)}% funded
              </span>
              {goal.remaining_amount !== null && goal.remaining_amount > 0 && (
                <span className="text-muted-foreground font-numeric">
                  {formatCompactINR(goal.remaining_amount)} to go
                </span>
              )}
            </div>
          </div>
        )}

        {/* The actionable line: what closing the gap costs per month. */}
        <div className="mt-auto pt-1 flex items-center justify-between gap-2 min-h-[1.25rem]">
          {goal.required_monthly !== null && goal.required_monthly > 0 ? (
            <span className="text-xs text-muted-foreground">
              {/* Whole rupees — paise on a monthly savings target is noise. */}
              <span className="font-numeric text-foreground">
                ₹{Math.round(goal.required_monthly).toLocaleString('en-IN')}
              </span>
              /month needed
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {goal.source_count === 0
                ? 'No sources yet'
                : `${goal.source_count} source${goal.source_count === 1 ? '' : 's'}`}
            </span>
          )}

          {(goal.has_over_allocated_source || goal.has_stale_source) && (
            <AlertTriangle
              className="w-3.5 h-3.5 text-warning flex-shrink-0"
              aria-label="This goal needs attention"
            />
          )}
        </div>
      </div>
    </Link>
  )
}
