/**
 * Financial Goals API Client
 *
 * Goals are a virtual allocation layer over assets that already exist — no goal
 * holds money of its own. Every derived figure below (allocated_amount,
 * progress, status, headroom) is computed by the backend against live asset
 * values; the UI only renders it.
 */

import { apiClient } from './client'

export type GoalSourceType = 'investment' | 'fixed_deposit' | 'bank_account'

export type GoalTrackStatus =
  | 'on_track'
  | 'needs_attention'
  | 'behind'
  | 'achieved'
  | 'no_date'      // has a target amount, but no deadline to pace against
  | 'no_target'    // flexible goal, e.g. "Travel"

export type AllocationMode = 'percent' | 'amount'

export const GOAL_ICONS = [
  'Target', 'Home', 'Car', 'Plane', 'GraduationCap', 'Heart',
  'Shield', 'Gift', 'Briefcase', 'Baby', 'PiggyBank', 'Sparkles',
] as const

export const GOAL_COLORS = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const

export interface Goal {
  id: string
  name: string
  target_amount: number | null
  target_date: string | null
  start_date: string | null
  icon: string
  color: string
  notes: string | null
  status: 'active' | 'archived'
  sort_order: number

  allocated_amount: number
  remaining_amount: number | null
  progress_percentage: number | null
  elapsed_percentage: number | null
  required_monthly: number | null
  days_remaining: number | null
  source_count: number
  has_over_allocated_source: boolean
  has_stale_source: boolean
  track_status: GoalTrackStatus

  user_id: string
  created_at: string
  updated_at: string
}

export interface GoalSourceRow {
  source_type: GoalSourceType
  source_id: string
  name: string
  subtitle: string
  asset_class: string
  source_value: number
  mode: AllocationMode
  percent: number | null
  amount: number | null
  allocated_amount: number
  is_over_allocated: boolean
  is_stale: boolean
}

export interface ClassCoverage {
  asset_class: string
  class_value: number
  allocated_amount: number
  holdings_total: number
  holdings_allocated: number
  /** Holdings this goal does not touch — some may be owned by another goal. */
  untouched_holdings_value: number
  /** Of those, what is genuinely still free to claim. */
  free_holdings_value: number
}

export interface GoalDetail extends Goal {
  sources: GoalSourceRow[]
  class_coverage: ClassCoverage[]
}

export interface OverAllocatedSource {
  source_type: GoalSourceType
  source_id: string
  name: string
  current_value: number
  claimed_amount: number
  claimed_percentage: number
  goal_names: string[]
}

export interface GoalsOverview {
  total_allocatable: number
  total_allocated: number
  total_unallocated: number
  allocated_percentage: number
  goal_count: number
  goals_on_track: number
  goals_needs_attention: number
  goals_behind: number
  goals_achieved: number
  goals_untracked: number
  over_allocated_sources: OverAllocatedSource[]
}

/** An allocatable asset plus how much of it is still free to claim. */
export interface AssetSourceWithHeadroom {
  source_type: GoalSourceType
  source_id: string
  name: string
  subtitle: string
  asset_class: string
  current_value: number
  claimed_by_others_amount: number
  claimed_by_others_percentage: number
  available_amount: number
  available_percentage: number
  this_goal_mode: AllocationMode | null
  this_goal_percent: number | null
  this_goal_amount: number | null
}

export interface GoalCreate {
  name: string
  target_amount?: number | null
  target_date?: string | null
  start_date?: string | null
  icon?: string
  color?: string
  notes?: string | null
}

export interface GoalUpdate {
  name?: string
  target_amount?: number | null
  target_date?: string | null
  start_date?: string | null
  icon?: string
  color?: string
  notes?: string | null
  status?: 'active' | 'archived'
  sort_order?: number
}

export interface AllocationWrite {
  source_type: GoalSourceType
  source_id: string
  mode: AllocationMode
  percent?: number
  amount?: number
}

export const goalApi = {
  getAll: async (includeArchived = false) => {
    // Only send the flag when it is on — the client stringifies every param it
    // is given, so passing `false`/undefined blindly is a habit worth avoiding.
    const query = includeArchived ? '?include_archived=true' : ''
    return await apiClient.get<Goal[]>(`/api/v1/goals/${query}`)
  },

  getOverview: async () => {
    return await apiClient.get<GoalsOverview>('/api/v1/goals/overview')
  },

  /**
   * Allocatable assets with their remaining headroom.
   * Pass `goalId` when editing an existing goal so its own claim is not counted
   * against itself.
   */
  getSources: async (goalId?: string) => {
    const query = goalId ? `?goal_id=${encodeURIComponent(goalId)}` : ''
    return await apiClient.get<AssetSourceWithHeadroom[]>(`/api/v1/goals/sources${query}`)
  },

  getById: async (id: string) => {
    return await apiClient.get<GoalDetail>(`/api/v1/goals/${id}`)
  },

  create: async (data: GoalCreate) => {
    return await apiClient.post<Goal>('/api/v1/goals/', data)
  },

  update: async (id: string, data: GoalUpdate) => {
    return await apiClient.put<Goal>(`/api/v1/goals/${id}`, data)
  },

  delete: async (id: string) => {
    await apiClient.delete(`/api/v1/goals/${id}`)
  },

  /**
   * Upsert one or many allocation rows for a goal. Sent as a batch so that
   * "apply 20% to every Mutual Fund" is validated atomically — it either fits
   * everywhere or is rejected as a whole.
   */
  setAllocations: async (goalId: string, allocations: AllocationWrite[]) => {
    return await apiClient.put<GoalDetail>(
      `/api/v1/goals/${goalId}/allocations`,
      { allocations },
    )
  },

  removeAllocation: async (goalId: string, sourceType: GoalSourceType, sourceId: string) => {
    await apiClient.delete(`/api/v1/goals/${goalId}/allocations/${sourceType}/${sourceId}`)
  },
}

// -- shared display helpers -------------------------------------------------

export const GOAL_STATUS_LABEL: Record<GoalTrackStatus, string> = {
  on_track: 'On Track',
  needs_attention: 'Needs Attention',
  behind: 'Behind',
  achieved: 'Achieved',
  no_date: 'No Deadline',
  no_target: 'Flexible',
}

/** Tailwind class for a Progress bar indicator, per status. */
export const GOAL_STATUS_BAR: Record<GoalTrackStatus, string> = {
  on_track: 'bg-positive',
  needs_attention: 'bg-warning',
  behind: 'bg-negative',
  achieved: 'bg-primary',
  no_date: 'bg-chart-2',
  no_target: 'bg-chart-2',
}

/** Badge variant, per status. */
export const GOAL_STATUS_BADGE: Record<
  GoalTrackStatus,
  'default' | 'secondary' | 'destructive' | 'warning' | 'positive'
> = {
  on_track: 'positive',
  needs_attention: 'warning',
  behind: 'destructive',
  achieved: 'default',
  no_date: 'secondary',
  no_target: 'secondary',
}

/**
 * Per-goal accent classes.
 *
 * Spelled out rather than interpolated (`bg-${color}/10`) because Tailwind
 * scans source text for complete class names — a constructed one is never
 * generated and silently renders unstyled.
 */
export const GOAL_COLOR_CLASSES: Record<string, { bg: string; text: string; bar: string }> = {
  'chart-1': { bg: 'bg-chart-1/10', text: 'text-chart-1', bar: 'bg-chart-1' },
  'chart-2': { bg: 'bg-chart-2/10', text: 'text-chart-2', bar: 'bg-chart-2' },
  'chart-3': { bg: 'bg-chart-3/10', text: 'text-chart-3', bar: 'bg-chart-3' },
  'chart-4': { bg: 'bg-chart-4/10', text: 'text-chart-4', bar: 'bg-chart-4' },
  'chart-5': { bg: 'bg-chart-5/10', text: 'text-chart-5', bar: 'bg-chart-5' },
}

export function goalColorClasses(color: string) {
  return GOAL_COLOR_CLASSES[color] ?? GOAL_COLOR_CLASSES['chart-1']
}
