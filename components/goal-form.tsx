"use client"

/**
 * Goal create/edit dialog.
 *
 * The target amount is optional on purpose — a goal like "Travel" is a real
 * goal even without a number attached, it just cannot be paced.
 */

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GOAL_COLORS, GOAL_ICONS, goalApi, goalColorClasses, type Goal } from '@/lib/api/goals'
import { formatCompactINR, getApiErrorMessage } from '@/lib/utils'
import { goalIcon } from '@/components/goal-card'

interface GoalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  goal?: Goal
}

/** Common horizons, so the usual case is one tap rather than a date picker. */
const DATE_PRESETS = [
  { label: '6 months', months: 6 },
  { label: '1 year', months: 12 },
  { label: '3 years', months: 36 },
  { label: '5 years', months: 60 },
]

function isoDateMonthsFromNow(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

const EMPTY = {
  name: '',
  target_amount: '',
  target_date: '',
  icon: 'Target',
  color: 'chart-1',
  notes: '',
}

export function GoalForm({ open, onOpenChange, onSuccess, goal }: GoalFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (goal) {
      setForm({
        name: goal.name,
        target_amount: goal.target_amount !== null ? String(goal.target_amount) : '',
        target_date: goal.target_date ? goal.target_date.split('T')[0] : '',
        icon: goal.icon,
        color: goal.color,
        notes: goal.notes ?? '',
      })
    } else {
      setForm(EMPTY)
    }
    setError(null)
  }, [goal, open])

  const targetAmount = form.target_amount.trim() === '' ? null : Number(form.target_amount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      setError('Give the goal a name')
      return
    }
    if (targetAmount !== null && (!Number.isFinite(targetAmount) || targetAmount <= 0)) {
      setError('Target amount must be a positive number, or left blank for a flexible goal')
      return
    }

    setLoading(true)
    setError(null)

    // Send nulls, not undefined, so clearing a target or date actually clears it.
    const payload = {
      name: form.name.trim(),
      target_amount: targetAmount,
      target_date: form.target_date || null,
      icon: form.icon,
      color: form.color,
      notes: form.notes.trim() || null,
    }

    try {
      if (goal) {
        await goalApi.update(goal.id, payload)
      } else {
        await goalApi.create(payload)
      }
      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to save goal'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'New Goal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="alert-error">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="goal-name">Name</Label>
            <Input
              id="goal-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Emergency Fund"
              maxLength={60}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-target">Target amount</Label>
              <Input
                id="goal-target"
                type="number"
                min="0"
                // "any": stepping by 1000 makes HTML5 validation reject a
                // perfectly reasonable target like ₹6,50,500.
                step="any"
                value={form.target_amount}
                onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
                placeholder="Optional"
              />
              <p className="text-xs text-muted-foreground">
                {targetAmount
                  ? formatCompactINR(targetAmount)
                  : 'Leave blank for a flexible goal'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-date">Target date</Label>
              <Input
                id="goal-date"
                type="date"
                value={form.target_date}
                onChange={(e) => setForm({ ...form, target_date: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {form.target_date ? 'Used to pace progress' : 'Optional — no deadline'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DATE_PRESETS.map((preset) => {
              const value = isoDateMonthsFromNow(preset.months)
              const active = form.target_date === value
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setForm({ ...form, target_date: active ? '' : value })}
                  className={`px-2 py-0.5 text-xs rounded-md border transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:bg-accent text-muted-foreground'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_ICONS.map((name) => {
                const Icon = goalIcon(name)
                const active = form.icon === name
                return (
                  <button
                    key={name}
                    type="button"
                    aria-label={name}
                    aria-pressed={active}
                    onClick={() => setForm({ ...form, icon: name })}
                    className={`w-9 h-9 rounded-md border flex items-center justify-center transition-colors ${
                      active
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-card border-border hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Colour</Label>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_COLORS.map((color) => {
                const accent = goalColorClasses(color)
                const active = form.color === color
                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    aria-pressed={active}
                    onClick={() => setForm({ ...form, color })}
                    className={`w-9 h-9 rounded-md border flex items-center justify-center transition-colors ${
                      active ? 'border-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${accent.bar}`} />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-notes">Notes</Label>
            <textarea
              id="goal-notes"
              className="input-sm w-full min-h-[64px] resize-y"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              maxLength={500}
              placeholder="Optional"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : goal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
