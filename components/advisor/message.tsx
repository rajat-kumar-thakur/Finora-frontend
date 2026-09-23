"use client"

import { Sparkles, TriangleAlert } from 'lucide-react'
import type { MessagePart, MessageStatus } from '@/lib/api'
import { ChartBlock } from '@/components/advisor/chart-block'
import { Markdown } from '@/components/advisor/markdown'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  parts: MessagePart[]
  status: MessageStatus | 'streaming'
  /** Why the reply failed; any partial answer stays in `parts`. */
  error?: string
}

export function UserMessage({ message }: { message: ChatMessage }) {
  const text = message.parts.map((p) => p.text ?? '').join('')
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary/12 border border-primary/20 px-4 py-2.5 text-sm text-foreground whitespace-pre-wrap break-words">
        {text}
      </div>
    </div>
  )
}

export function AssistantMessage({ message, statusLabel }: { message: ChatMessage; statusLabel?: string | null }) {
  const streaming = message.status === 'streaming'
  const hasContent = message.parts.some((p) => (p.type === 'text' && p.text) || (p.type === 'chart' && p.chart))
  const errorText = message.status === 'error' ? message.error || 'Something went wrong.' : null

  return (
    <div className="flex gap-3">
      <div className="h-7 w-7 shrink-0 rounded-md bg-primary/12 text-primary flex items-center justify-center mt-0.5">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {message.parts.map((part, i) =>
          part.type === 'chart' && part.chart ? (
            <ChartBlock key={i} spec={part.chart} />
          ) : part.text ? (
            <Markdown key={i} text={part.text} />
          ) : null
        )}
        {errorText !== null && (
          <div className="flex items-start gap-2 rounded-md border border-negative/30 bg-negative/10 px-3 py-2 text-sm text-foreground">
            <TriangleAlert className="h-4 w-4 text-negative shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorText}</span>
          </div>
        )}

        {streaming && (statusLabel || !hasContent) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
            <span className="spinner-sm text-primary" aria-hidden="true" />
            {statusLabel || 'Thinking…'}
          </div>
        )}
        {message.status === 'incomplete' && (
          <div className="text-xs text-muted-foreground">Stopped before finishing.</div>
        )}
      </div>
    </div>
  )
}
