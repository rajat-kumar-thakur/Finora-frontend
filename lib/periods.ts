/**
 * Period helpers for the Insights period selector.
 *
 * Dates are naive `YYYY-MM-DDTHH:mm:ss` strings — the same format
 * category-breakdown's buildDateRange sends and the backend compares against
 * stored (naive) transaction dates.
 */

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export interface CalendarDay {
  year: number
  month: number // 1-12
  day: number
}

export interface ComparisonRange {
  start_date: string
  end_date: string
  /** e.g. "vs Aug 1–23", "vs August 2026", "vs 2025", "vs Jan 1–Sep 23, 2025" */
  label: string
}

/** Today's calendar date in IST, regardless of the browser's timezone. */
export function todayIST(): CalendarDay {
  // en-CA formats as YYYY-MM-DD
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })
    .format(new Date())
    .split('-')
    .map(Number)
  return { year, month, day }
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function startOf(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}T00:00:00`
}

function endOf(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}T23:59:59`
}

/**
 * The period to compare a selected month/year against.
 *
 * - year 0 (All Time) → null
 * - a period that starts after today → null (nothing to compare yet)
 * - a completed month → the full previous month; an in-progress month → the
 *   same days of the previous month (Sep 1–23 → Aug 1–23), clamped to that
 *   month's length (Mar 1–31 → Feb 1–28/29)
 * - month 0 (whole year): a completed year → the full previous year; the
 *   in-progress year → Jan 1 through the same day last year (Feb 29 clamped)
 */
export function previousRange(year: number, month: number, today: CalendarDay): ComparisonRange | null {
  if (year === 0) return null

  if (month === 0) {
    if (year > today.year) return null
    const prev = year - 1
    if (year < today.year) {
      return { start_date: startOf(prev, 1, 1), end_date: endOf(prev, 12, 31), label: `vs ${prev}` }
    }
    const day = Math.min(today.day, lastDayOfMonth(prev, today.month))
    return {
      start_date: startOf(prev, 1, 1),
      end_date: endOf(prev, today.month, day),
      label: `vs Jan 1–${MONTH_SHORT[today.month - 1]} ${day}, ${prev}`,
    }
  }

  const selected = year * 12 + month
  const current = today.year * 12 + today.month
  if (selected > current) return null

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevLast = lastDayOfMonth(prevYear, prevMonth)

  if (selected < current) {
    return {
      start_date: startOf(prevYear, prevMonth, 1),
      end_date: endOf(prevYear, prevMonth, prevLast),
      label: `vs ${MONTH_LONG[prevMonth - 1]} ${prevYear}`,
    }
  }

  const day = Math.min(today.day, prevLast)
  return {
    start_date: startOf(prevYear, prevMonth, 1),
    end_date: endOf(prevYear, prevMonth, day),
    label: day === 1
      ? `vs ${MONTH_SHORT[prevMonth - 1]} 1`
      : `vs ${MONTH_SHORT[prevMonth - 1]} 1–${day}`,
  }
}
