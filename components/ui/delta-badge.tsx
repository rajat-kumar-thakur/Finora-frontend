/**
 * DeltaBadge — change vs a previous period, e.g. "▲ ₹1,210 (+17%)".
 *
 * Same maths and colour semantics as month-comparison: the percentage is
 * relative to |previous| and hidden when previous is 0 (shown as "New" when
 * there's something now). `moreIsBetter` decides whether an increase is
 * coloured positive (income, investing, net) or negative (spending).
 */

import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeltaBadgeProps {
  current: number
  previous: number
  moreIsBetter: boolean
  /**
   * Whether there was any activity in the previous period. Pass it when a
   * value can be 0 despite activity (a net that cancels out) so "New" isn't
   * shown wrongly; defaults to `previous !== 0`.
   */
  hadPrevious?: boolean
  className?: string
}

function formatINR0(amount: number): string {
  return amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function DeltaBadge({ current, previous, moreIsBetter, hadPrevious, className }: DeltaBadgeProps) {
  if (!(hadPrevious ?? previous !== 0) && current !== 0) {
    return (
      <span className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded bg-accent text-muted-foreground', className)}>
        New
      </span>
    )
  }

  const delta = current - previous
  const pct = previous !== 0 ? (delta / Math.abs(previous)) * 100 : 0
  const isUp = delta > 0
  const isDown = delta < 0
  const isNeutral = Math.abs(delta) < 0.005
  const isGood = moreIsBetter ? isUp : isDown

  const colorClass = isNeutral
    ? 'text-muted-foreground'
    : isGood
      ? 'text-positive'
      : 'text-negative'
  const Icon = isNeutral ? Minus : isUp ? TrendingUp : TrendingDown
  const sign = isNeutral ? '' : isUp ? '+' : '−'

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap', colorClass, className)}
      title={`Previous: ₹${previous.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="font-numeric">{sign}₹{formatINR0(Math.abs(delta))}</span>
      {previous !== 0 && !isNeutral && (
        <span className="font-numeric opacity-80">({sign}{Math.abs(pct).toFixed(0)}%)</span>
      )}
    </span>
  )
}
