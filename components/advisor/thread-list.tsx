"use client"

import { useState } from 'react'
import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import type { AdvisorThread } from '@/lib/api'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'

export function relativeTime(iso: string): string {
  // Backend datetimes are naive UTC
  const then = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`).getTime()
  const minutes = Math.round((Date.now() - then) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(then).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function ThreadList({
  threads,
  activeId,
  onSelect,
  onNew,
  onDelete,
  disabled,
}: {
  threads: AdvisorThread[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  disabled?: boolean
}) {
  const [pendingDelete, setPendingDelete] = useState<AdvisorThread | null>(null)

  return (
    <nav aria-label="Conversations" className="flex flex-col min-h-0 h-full">
      <button
        type="button"
        onClick={onNew}
        className="btn-primary w-full mb-3"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        New chat
      </button>

      <div className="px-1 mb-2 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-muted-foreground">
        History
      </div>
      <ul className="flex-1 overflow-y-auto space-y-0.5 -mx-1 px-1">
        {threads.length === 0 && (
          <li className="px-2 py-3 text-xs text-muted-foreground">No conversations yet.</li>
        )}
        {threads.map((t) => (
          <li key={t.id} className="group relative">
            <button
              type="button"
              onClick={() => onSelect(t.id)}
              disabled={disabled}
              className={cn(
                'w-full text-left rounded-md pl-2 pr-8 py-2 transition-colors disabled:opacity-60',
                t.id === activeId ? 'bg-accent text-foreground' : 'text-foreground/85 hover:bg-accent/60'
              )}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate text-sm">{t.title}</span>
              </span>
              <span className="block pl-5.5 text-[11px] text-muted-foreground">{relativeTime(t.updated_at)}</span>
            </button>
            <button
              type="button"
              onClick={() => setPendingDelete(t)}
              disabled={disabled}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-negative hover:bg-negative/10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
              aria-label={`Delete "${t.title}"`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete conversation?"
        description={pendingDelete ? `"${pendingDelete.title}" will be permanently deleted.` : undefined}
        onConfirm={() => pendingDelete && onDelete(pendingDelete.id)}
      />
    </nav>
  )
}
