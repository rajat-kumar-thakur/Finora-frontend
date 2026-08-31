"use client"

/**
 * Goal funding breakdown, grouped by asset class.
 *
 * Allocations are stored per individual holding, but a user thinks in classes
 * ("20% of my mutual funds"). So holdings are rolled into one parent row per
 * class, expandable to the individual rows underneath. A class whose members
 * all share the same share shows that share; a mixed class shows the blended
 * effective percentage instead.
 */

import { Fragment, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ClassCoverage, GoalSourceRow } from '@/lib/api/goals'
import { formatCompactINR, formatCurrency } from '@/lib/utils'

interface GoalSourceTableProps {
  sources: GoalSourceRow[]
  coverage: ClassCoverage[]
  onEdit: (row: GoalSourceRow) => void
  onRemove: (row: GoalSourceRow) => void
}

interface ClassGroup {
  assetClass: string
  rows: GoalSourceRow[]
  totalValue: number
  totalAllocated: number
  /** The shared percentage when every member matches; null when mixed. */
  uniformPercent: number | null
  hasWarning: boolean
}

function groupByClass(sources: GoalSourceRow[]): ClassGroup[] {
  const map = new Map<string, GoalSourceRow[]>()
  for (const row of sources) {
    const list = map.get(row.asset_class) ?? []
    list.push(row)
    map.set(row.asset_class, list)
  }

  return Array.from(map.entries()).map(([assetClass, rows]) => {
    const percents = rows.map((r) => (r.mode === 'percent' ? r.percent : null))
    const allSamePercent =
      percents.every((p) => p !== null) &&
      new Set(percents).size === 1

    return {
      assetClass,
      rows,
      totalValue: rows.reduce((sum, r) => sum + r.source_value, 0),
      totalAllocated: rows.reduce((sum, r) => sum + r.allocated_amount, 0),
      uniformPercent: allSamePercent ? (percents[0] as number) : null,
      hasWarning: rows.some((r) => r.is_over_allocated || r.is_stale),
    }
  })
}

/** How a single row's share reads: "40%" or "₹2,00,000 fixed". */
function shareLabel(row: GoalSourceRow): string {
  if (row.mode === 'percent') return `${row.percent ?? 0}%`
  return `${formatCompactINR(row.amount ?? 0)} fixed`
}

export function GoalSourceTable({
  sources, coverage, onEdit, onRemove,
}: GoalSourceTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const groups = groupByClass(sources)

  const toggle = (assetClass: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(assetClass)) next.delete(assetClass)
      else next.add(assetClass)
      return next
    })
  }

  const coverageFor = (assetClass: string) =>
    coverage.find((c) => c.asset_class === assetClass)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="h-10 px-3 text-left text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Source
            </th>
            <th className="h-10 px-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap">
              Total Value
            </th>
            <th className="h-10 px-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Allocation
            </th>
            <th className="h-10 px-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Allocated
            </th>
            <th className="h-10 px-3 w-20" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const single = group.rows.length === 1
            const isOpen = expanded.has(group.assetClass)
            const cov = coverageFor(group.assetClass)
            const untouched = cov
              ? cov.holdings_total - cov.holdings_allocated
              : 0

            return (
              <Fragment key={group.assetClass}>
                {/* Parent row. A class with one holding is its own parent — no
                    point making the user expand a group of one. */}
                <tr className="border-b border-border hover:bg-surface-raised/60">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {!single ? (
                        <button
                          type="button"
                          onClick={() => toggle(group.assetClass)}
                          aria-expanded={isOpen}
                          aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${group.assetClass}`}
                          className="text-muted-foreground hover:text-foreground flex-shrink-0"
                        >
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <span className="w-4 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-foreground truncate flex items-center gap-1.5">
                          {single ? group.rows[0].name : group.assetClass}
                          {group.hasWarning && (
                            <AlertTriangle
                              className="w-3.5 h-3.5 text-warning flex-shrink-0"
                              aria-label="Needs attention"
                            />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {single
                            ? group.rows[0].subtitle
                            : `${group.rows.length} holdings`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-numeric whitespace-nowrap text-muted-foreground">
                    {formatCompactINR(group.totalValue)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-numeric whitespace-nowrap">
                    {single
                      ? shareLabel(group.rows[0])
                      : group.uniformPercent !== null
                        ? `${group.uniformPercent}%`
                        : group.totalValue > 0
                          ? `~${((group.totalAllocated / group.totalValue) * 100).toFixed(0)}%`
                          : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-numeric whitespace-nowrap text-foreground font-medium">
                    {formatCurrency(group.totalAllocated)}
                  </td>
                  <td className="px-3 py-2.5">
                    {single ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(group.rows[0])}
                          aria-label={`Edit ${group.rows[0].name}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemove(group.rows[0])}
                          aria-label={`Remove ${group.rows[0].name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-right text-xs text-muted-foreground">
                        {isOpen ? '' : 'expand'}
                      </div>
                    )}
                  </td>
                </tr>

                {/* Children */}
                {!single && isOpen && group.rows.map((row) => (
                  <tr
                    key={`${row.source_type}:${row.source_id}`}
                    className="border-b border-border bg-surface-raised/30"
                  >
                    <td className="px-3 py-2 pl-10">
                      <div className="min-w-0">
                        <div className="text-foreground truncate flex items-center gap-1.5 text-[13px]">
                          {row.name}
                          {(row.is_over_allocated || row.is_stale) && (
                            <AlertTriangle
                              className="w-3 h-3 text-warning flex-shrink-0"
                              aria-label="Needs attention"
                            />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {row.subtitle}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-numeric whitespace-nowrap text-muted-foreground text-[13px]">
                      {formatCompactINR(row.source_value)}
                    </td>
                    <td className="px-3 py-2 text-right font-numeric whitespace-nowrap text-[13px]">
                      {shareLabel(row)}
                    </td>
                    <td className="px-3 py-2 text-right font-numeric whitespace-nowrap text-[13px]">
                      {formatCurrency(row.allocated_amount)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(row)}
                          aria-label={`Edit ${row.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemove(row)}
                          aria-label={`Remove ${row.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Coverage footnote — the guard against a newly-bought holding
                    silently sitting outside the split. */}
                {untouched > 0 && cov && (
                  <tr className="border-b border-border">
                    <td colSpan={5} className="px-3 py-1.5 pl-10">
                      <span className="text-xs text-muted-foreground">
                        {cov.holdings_allocated} of {cov.holdings_total} {group.assetClass}
                        {' '}holdings allocated ·{' '}
                        <span className="font-numeric">
                          {formatCompactINR(cov.untouched_holdings_value)}
                        </span>
                        {' '}not in this goal
                        {/* Distinguish "this goal skips it" from "you could take it" —
                            the rest is already owned by another goal. */}
                        {cov.free_holdings_value < cov.untouched_holdings_value && (
                          <>
                            , of which{' '}
                            <span className="font-numeric">
                              {formatCompactINR(cov.free_holdings_value)}
                            </span>
                            {' '}is still free
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
