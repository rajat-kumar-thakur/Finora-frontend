import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency in Indian Rupees (INR)
 */
export function formatCurrency(amount: number | undefined | null): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

/**
 * Compact INR formatter for chart axes/tooltips, e.g. 2460318 -> "₹24.6L".
 * Indian scale: Cr (crore, 1e7), L (lakh, 1e5), k (thousand, 1e3).
 */
export function formatCompactINR(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(1)}Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(0)}k`
  return `${sign}₹${abs.toFixed(0)}`
}

/**
 * Turn a "field" path into a readable label, e.g. "purchase_price" -> "Purchase price".
 */
function prettifyField(field: string): string {
  const spaced = field.replace(/_/g, ' ').trim()
  if (!spaced) return ''
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/**
 * Format a single error entry into a string.
 *
 * Handles FastAPI/Pydantic validation entries shaped like
 * { type, loc, msg, input, ctx, url } as well as plain strings.
 */
function formatErrorEntry(entry: unknown): string {
  if (typeof entry === 'string') return entry
  if (entry && typeof entry === 'object') {
    const msg = (entry as { msg?: unknown }).msg
    const loc = (entry as { loc?: unknown }).loc
    const msgStr = typeof msg === 'string' ? msg : ''

    // loc is typically ["body", "symbol"] — use the last non-"body" segment as the field name.
    let field = ''
    if (Array.isArray(loc)) {
      const parts = loc.filter((p) => typeof p === 'string' && p !== 'body')
      if (parts.length) field = String(parts[parts.length - 1])
    }

    if (field && msgStr) return `${prettifyField(field)}: ${msgStr}`
    if (msgStr) return msgStr
  }
  return ''
}

/**
 * Normalize any caught error into a human-readable string.
 *
 * Critically, FastAPI returns 422 validation errors as `data.detail` being an
 * *array of objects* ({ type, loc, msg, input, ctx, url }). Putting such an
 * object/array directly into React state and rendering it throws React error
 * #31 ("Objects are not valid as a React child"), which white-screens the app.
 * Always route caught API errors through this helper before storing them.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!error) return fallback

  const detail = (error as { data?: { detail?: unknown } })?.data?.detail

  // 422 validation errors: detail is an array of error objects.
  if (Array.isArray(detail)) {
    const messages = detail.map(formatErrorEntry).filter(Boolean)
    if (messages.length) return messages.join('; ')
  }

  // HTTPException-style errors: detail is a plain string.
  if (typeof detail === 'string' && detail.trim()) return detail

  // Occasionally a single error object.
  if (detail && typeof detail === 'object') {
    const single = formatErrorEntry(detail)
    if (single) return single
  }

  const message = (error as { message?: unknown }).message
  if (typeof message === 'string' && message.trim()) return message

  return fallback
}
