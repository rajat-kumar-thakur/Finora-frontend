"use client"

import * as React from "react"
import { X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

/**
 * Renders toasts dispatched through the existing use-toast store.
 * Hand-built (no @radix-ui/react-toast dependency). Mounted once at the root.
 */
export function Toaster() {
  const { toasts, dismiss } = useToast()
  const visible = toasts.filter((t) => t.open !== false)

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-24 right-4 z-[110] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 lg:bottom-6 lg:right-6"
    >
      {visible.map((t) => (
        <ToastCard
          key={t.id}
          destructive={t.variant === "destructive"}
          onDismiss={() => dismiss(t.id)}
        >
          {t.title && (
            <p className="text-sm font-medium text-foreground">{t.title}</p>
          )}
          {t.description && (
            <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
          )}
        </ToastCard>
      ))}
    </div>
  )
}

function ToastCard({
  destructive,
  onDismiss,
  children,
}: {
  destructive: boolean
  onDismiss: () => void
  children: React.ReactNode
}) {
  // Auto-dismiss after 5s (the store's own removal delay is effectively infinite).
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      role={destructive ? "alert" : "status"}
      className={cn(
        "relative rounded-lg border border-l-2 border-border bg-popover p-4 pr-10 shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-200",
        destructive ? "border-l-destructive" : "border-l-positive"
      )}
    >
      {children}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
