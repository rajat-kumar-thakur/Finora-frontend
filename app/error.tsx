'use client'

/**
 * Root-level error boundary.
 *
 * Catches render-time exceptions on routes not covered by a nested boundary
 * (auth pages, landing page) so they degrade to a recoverable screen instead
 * of a blank "client-side exception" page.
 */

import { ErrorFallback } from '@/components/error-fallback'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <ErrorFallback error={error} reset={reset} />
    </div>
  )
}
