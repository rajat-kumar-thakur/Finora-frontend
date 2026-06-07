'use client'

/**
 * Error boundary for the dashboard route segment.
 *
 * Catches render-time exceptions in any dashboard page and shows a recoverable
 * fallback inside the dashboard shell, instead of crashing the entire app.
 */

import { ErrorFallback } from '@/components/error-fallback'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorFallback error={error} reset={reset} />
}
