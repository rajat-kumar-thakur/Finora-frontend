'use client'

/**
 * Shared error-boundary fallback UI.
 *
 * Rendered by Next.js route-segment `error.tsx` boundaries when a client-side
 * exception escapes a page. Without a boundary, such an error white-screens the
 * whole app ("Application error: a client-side exception has occurred").
 */

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
  className?: string
}

export function ErrorFallback({ error, reset, className }: ErrorFallbackProps) {
  useEffect(() => {
    // Surface the underlying error for debugging.
    console.error(error)
  }, [error])

  return (
    <div
      className={
        className ??
        'flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center'
      }
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          An unexpected error occurred while loading this page. You can try
          again — if it keeps happening, refresh the page.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button
          variant="outline"
          onClick={() => {
            if (typeof window !== 'undefined') window.location.reload()
          }}
        >
          Refresh
        </Button>
      </div>
    </div>
  )
}
