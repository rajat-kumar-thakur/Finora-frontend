/**
 * Shared recharts theme — Terminal Pro.
 *
 * Values are plain `var(--token)` strings. recharts maps these to presentation
 * attributes / inline styles, where CSS custom properties resolve correctly —
 * this is also why the old `hsl(var(--oklch-token))` wrappers were invalid.
 *
 * Token meanings (single source of truth, from globals.css):
 *   --chart-1 mint · --chart-2 ice · --chart-3 violet · --chart-4 amber · --chart-5 coral
 * Money-directional series use --positive / --negative directly.
 */

export const chartAxisTick = {
  fill: "var(--muted-foreground)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
}

export const chartAxisLine = { stroke: "var(--border)" }

export const chartGrid = {
  stroke: "var(--border)",
  strokeOpacity: 0.5,
  strokeDasharray: "3 3",
  vertical: false,
}

export const chartCursor = { stroke: "var(--border)", strokeDasharray: "3 3" }

export const chartTooltipContentStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
}

export const chartTooltipLabelStyle = { color: "var(--muted-foreground)" }

export const CHART_SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]
