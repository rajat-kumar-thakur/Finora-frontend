"use client"

/**
 * ChartBlock — renders an advisor ChartSpec with the app's Recharts theme.
 *
 * Spec rows are wide-format: [x label, value per series]. Series take the
 * categorical palette in fixed order (chart-1..5); a series or slice named
 * "Other" — or a 6th series — is muted. Tones map to the semantic money tokens.
 * One y-axis only (combo shares it). Every chart has a Table view.
 */

import { useMemo, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts'
import { BarChart3, Table2 } from 'lucide-react'
import type { ChartSeries, ChartSpec } from '@/lib/api'
import {
  CHART_SERIES,
  chartAxisLine,
  chartAxisTick,
  chartTooltipContentStyle,
  chartTooltipLabelStyle,
} from '@/lib/chart-theme'
import { cn, formatCompactINR } from '@/lib/utils'

const MUTED = 'var(--muted-foreground)'
const SURFACE = 'var(--card)'
const TONES: Record<string, string> = {
  positive: 'var(--positive)',
  negative: 'var(--negative)',
  primary: 'var(--primary)',
  warning: 'var(--warning)',
}
// Solid hairline grid (dashed grids read as thresholds)
const GRID = { stroke: 'var(--border)', strokeOpacity: 0.6, vertical: false }
const TOOLTIP_ITEM = { color: 'var(--popover-foreground)' }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MAX_SLICES = 6

function isOther(label: string): boolean {
  return /^other\b/i.test(label)
}

/** "day_of_week" → "Day of week"; labels that are already human stay as-is. */
function pretty(name: string): string {
  if (!name.includes('_') && !/^[a-z]/.test(name)) return name
  const spaced = name.replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function seriesColor(s: ChartSeries, index: number): string {
  if (s.tone !== 'auto' && TONES[s.tone]) return TONES[s.tone]
  if (isOther(s.label) || index >= CHART_SERIES.length) return MUTED
  return CHART_SERIES[index]
}

/** "2026-08" → "Aug '26", "2026-08-12" → "12 Aug"; anything else unchanged. */
function formatLabel(value: unknown): string {
  const s = String(value ?? '')
  let m = /^(\d{4})-(\d{2})$/.exec(s)
  if (m) return `${MONTHS[Number(m[2]) - 1]} '${m[1].slice(2)}`
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (m) return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}`
  return s
}

function formatters(format: ChartSpec['value_format']) {
  if (format === 'percent') {
    const f = (v: number) => `${v.toFixed(Math.abs(v) < 10 ? 1 : 0)}%`
    return { axis: f, full: f }
  }
  if (format === 'number') {
    const f = (v: number) => v.toLocaleString('en-IN', { maximumFractionDigits: 1 })
    return { axis: f, full: f }
  }
  return {
    axis: formatCompactINR,
    full: (v: number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
  }
}

type Row = Record<string, string | number | null>

export function ChartBlock({ spec }: { spec: ChartSpec }) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const fmt = formatters(spec.value_format)

  // Recharts treats dots in a dataKey as a path, so key series by index.
  const data: Row[] = useMemo(
    () =>
      spec.rows.map((r) => {
        const row: Row = { x: r[0] }
        spec.series.forEach((_, i) => {
          row[`s${i}`] = r[i + 1] as number | null
        })
        return row
      }),
    [spec]
  )
  const colors = spec.series.map(seriesColor)

  return (
    <figure className="rounded-lg border border-border bg-card p-3 sm:p-4">
      <figcaption className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{spec.title}</div>
          {spec.subtitle && <div className="text-xs text-muted-foreground mt-0.5">{spec.subtitle}</div>}
        </div>
        <button
          type="button"
          onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
          className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors"
          aria-label={view === 'chart' ? 'Show as table' : 'Show as chart'}
        >
          {view === 'chart' ? <Table2 className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
          {view === 'chart' ? 'Table' : 'Chart'}
        </button>
      </figcaption>

      {view === 'table' ? (
        <DataTable spec={spec} format={fmt.full} />
      ) : spec.type === 'heatmap' ? (
        <Heatmap spec={spec} format={fmt} />
      ) : spec.type === 'donut' ? (
        <Donut spec={spec} data={data} format={fmt.full} />
      ) : (
        <>
          <CartesianPlot spec={spec} data={data} colors={colors} fmt={fmt} />
          {spec.series.length > 1 && spec.type !== 'scatter' && (
            <Legend items={spec.series.map((s, i) => ({ label: s.label, color: colors[i], line: isLineKind(spec, s) }))} />
          )}
        </>
      )}
    </figure>
  )
}

function isLineKind(spec: ChartSpec, s: ChartSeries): boolean {
  if (spec.type === 'line' || spec.type === 'area') return true
  return spec.type === 'combo' && (s.kind === 'line' || s.kind === 'area')
}

function Legend({ items }: { items: { label: string; color: string; line: boolean }[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            className={cn('shrink-0', item.line ? 'h-0.5 w-3 rounded-full' : 'h-2.5 w-2.5 rounded-sm')}
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          {pretty(item.label)}
        </li>
      ))}
    </ul>
  )
}

function CartesianPlot({
  spec, data, colors, fmt,
}: {
  spec: ChartSpec
  data: Row[]
  colors: string[]
  fmt: { axis: (v: number) => string; full: (v: number) => string }
}) {
  const horizontal = spec.type === 'horizontal_bar'
  const height = horizontal ? Math.min(Math.max(data.length * 30 + 40, 160), 520) : 260
  const tooltip = (
    <Tooltip
      contentStyle={chartTooltipContentStyle}
      labelStyle={chartTooltipLabelStyle}
      itemStyle={TOOLTIP_ITEM}
      separator=": "
      cursor={{ fill: 'var(--accent)', fillOpacity: 0.4, stroke: 'var(--border)' }}
      labelFormatter={(label) => formatLabel(label)}
      formatter={(value, _name, item) => {
        const idx = Number(String(item?.dataKey ?? 's0').slice(1))
        return [typeof value === 'number' ? fmt.full(value) : String(value ?? '—'), spec.series[idx]?.label ?? '']
      }}
    />
  )
  const valueAxis = { tick: chartAxisTick, axisLine: false, tickLine: false, tickFormatter: fmt.axis, width: 56 }
  const labelAxis = { tick: chartAxisTick, axisLine: chartAxisLine, tickLine: false, tickFormatter: formatLabel }

  if (spec.type === 'scatter') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid {...GRID} vertical />
          <XAxis type="number" dataKey="x" name={spec.x} {...valueAxis} tickFormatter={(v) => String(v)} />
          <YAxis type="number" dataKey="s0" name={spec.series[0].label} {...valueAxis} />
          <Tooltip
            contentStyle={chartTooltipContentStyle}
            itemStyle={TOOLTIP_ITEM}
            cursor={{ stroke: 'var(--border)' }}
            formatter={(value, name) =>
              [name === spec.series[0].label && typeof value === 'number' ? fmt.full(value) : String(value), name]}
          />
          <Scatter data={data} fill={colors[0]} stroke={SURFACE} strokeWidth={2} r={5} />
        </ScatterChart>
      </ResponsiveContainer>
    )
  }

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid {...GRID} vertical horizontal={false} />
          <XAxis type="number" {...valueAxis} />
          <YAxis type="category" dataKey="x" {...labelAxis} width={112} interval={0} />
          {tooltip}
          {spec.series.map((s, i) => (
            <Bar key={i} dataKey={`s${i}`} fill={colors[i]} maxBarSize={24} radius={[0, 4, 4, 0]}
                 stroke={SURFACE} strokeWidth={spec.series.length > 1 ? 2 : 0} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const Chart = spec.type === 'line' ? LineChart
    : spec.type === 'area' ? AreaChart
    : spec.type === 'combo' ? ComposedChart
    : BarChart
  const stacked = spec.type === 'stacked_bar'
  const last = spec.series.length - 1

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="x" {...labelAxis} minTickGap={12} />
        <YAxis {...valueAxis} />
        {tooltip}
        {spec.series.map((s, i) => {
          const kind = spec.type === 'line' ? 'line'
            : spec.type === 'area' ? 'area'
            : spec.type === 'combo' ? (s.kind ?? (i === 0 ? 'bar' : 'line'))
            : 'bar'
          if (kind === 'line') {
            return (
              <Line key={i} type="monotone" dataKey={`s${i}`} stroke={colors[i]} strokeWidth={2}
                    strokeLinecap="round" strokeLinejoin="round" dot={false} connectNulls
                    activeDot={{ r: 4, fill: colors[i], stroke: SURFACE, strokeWidth: 2 }} />
            )
          }
          if (kind === 'area') {
            return (
              <Area key={i} type="monotone" dataKey={`s${i}`} stroke={colors[i]} strokeWidth={2}
                    fill={colors[i]} fillOpacity={0.12} connectNulls
                    activeDot={{ r: 4, fill: colors[i], stroke: SURFACE, strokeWidth: 2 }} />
            )
          }
          // 4px rounded data-end, square at the baseline; in a stack only the top segment rounds.
          const radius: [number, number, number, number] = stacked && i !== last ? [0, 0, 0, 0] : [4, 4, 0, 0]
          return (
            <Bar key={i} dataKey={`s${i}`} fill={colors[i]} maxBarSize={24} radius={radius}
                 stackId={stacked ? 'stack' : undefined}
                 stroke={SURFACE} strokeWidth={stacked || spec.series.length > 1 ? 2 : 0} />
          )
        })}
      </Chart>
    </ResponsiveContainer>
  )
}

function Donut({ spec, data, format }: { spec: ChartSpec; data: Row[]; format: (v: number) => string }) {
  // Keep at most MAX_SLICES slices; fold the smallest into "Other".
  const slices = useMemo(() => {
    const items = data
      .map((r) => ({ label: String(r.x ?? ''), value: Number(r.s0) || 0 }))
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value)
    if (items.length <= MAX_SLICES) return items
    const head = items.slice(0, MAX_SLICES - 1)
    const rest = items.slice(MAX_SLICES - 1).reduce((sum, s) => sum + s.value, 0)
    return [...head, { label: 'Other', value: rest }]
  }, [data])
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  const tone = spec.series[0]?.tone
  let paletteIndex = 0
  const colors = slices.map((s) => {
    if (isOther(s.label)) return MUTED
    const c = tone && tone !== 'auto' && paletteIndex === 0 && slices.length === 1
      ? TONES[tone]
      : CHART_SERIES[paletteIndex] ?? MUTED
    paletteIndex += 1
    return c
  })

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="h-[200px] w-full sm:w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="92%"
                 stroke={SURFACE} strokeWidth={2} isAnimationActive={false}>
              {slices.map((s, i) => <Cell key={s.label} fill={colors[i]} />)}
            </Pie>
            <Tooltip contentStyle={chartTooltipContentStyle} itemStyle={TOOLTIP_ITEM}
                     formatter={(value, name) => [typeof value === 'number' ? format(value) : String(value), name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-1.5 text-sm min-w-0">
        {slices.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: colors[i] }} aria-hidden="true" />
            <span className="truncate text-foreground/90">{s.label}</span>
            <span className="ml-auto font-numeric text-foreground whitespace-nowrap">{format(s.value)}</span>
            <span className="w-11 text-right font-numeric text-xs text-muted-foreground">
              {total > 0 ? `${((s.value / total) * 100).toFixed(0)}%` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Heatmap({ spec, format }: { spec: ChartSpec; format: { axis: (v: number) => string; full: (v: number) => string } }) {
  // One hue (primary), light → dark, on a sqrt scale so one large cell doesn't wash out the rest.
  const max = spec.rows.reduce(
    (m, r) => r.slice(1).reduce<number>((mm, v) => (typeof v === 'number' ? Math.max(mm, v) : mm), m),
    0
  )
  const intensity = (v: number | null) => (typeof v === 'number' && max > 0 ? Math.sqrt(Math.max(v, 0) / max) : 0)

  return (
    <div className="overflow-x-auto">
      <table className="border-separate" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th />
            {spec.series.map((s) => (
              <th key={s.column} scope="col"
                  className="px-1 pb-1 text-[11px] font-medium text-muted-foreground text-center whitespace-nowrap max-w-24 truncate">
                {formatLabel(s.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.rows.map((row, ri) => (
            <tr key={ri}>
              <th scope="row" className="pr-2 text-[11px] font-medium text-muted-foreground text-left whitespace-nowrap">
                {formatLabel(row[0])}
              </th>
              {row.slice(1).map((v, ci) => {
                const t = intensity(v as number | null)
                return (
                  <td
                    key={ci}
                    title={`${formatLabel(row[0])} · ${spec.series[ci]?.label}: ${typeof v === 'number' ? format.full(v) : '—'}`}
                    className={cn(
                      'h-9 min-w-14 px-1.5 rounded-sm text-center font-numeric text-[11px]',
                      t > 0.6 ? 'text-primary-foreground font-medium' : t > 0 ? 'text-foreground/90' : 'text-muted-foreground'
                    )}
                    style={{
                      backgroundColor: t > 0
                        ? `color-mix(in oklch, var(--primary) ${Math.round(12 + t * 88)}%, var(--surface-raised))`
                        : 'var(--surface-raised)',
                    }}
                  >
                    {typeof v === 'number' && v !== 0 ? format.axis(v) : ''}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DataTable({ spec, format }: { spec: ChartSpec; format: (v: number) => string }) {
  return (
    <div className="overflow-x-auto max-h-80 rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-raised text-muted-foreground sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">{pretty(spec.x)}</th>
            {spec.series.map((s) => (
              <th key={s.column} className="px-3 py-2 text-right text-xs font-medium whitespace-nowrap">{pretty(s.label)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-3 py-1.5 whitespace-nowrap text-foreground/90">{formatLabel(row[0])}</td>
              {row.slice(1).map((v, j) => (
                <td key={j} className="px-3 py-1.5 text-right font-numeric whitespace-nowrap">
                  {typeof v === 'number' ? format(v) : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
