"use client"

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Square } from 'lucide-react'

const MAX_LENGTH = 4000

export function Composer({
  onSend,
  onStop,
  streaming,
  disabled,
}: {
  onSend: (text: string) => void
  onStop: () => void
  streaming: boolean
  disabled?: boolean
}) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  // Auto-grow up to ~8 lines.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  const send = () => {
    const text = value.trim()
    if (!text || streaming || disabled) return
    onSend(text)
    setValue('')
  }

  return (
    <div className="flex items-end gap-2 rounded-xl border border-border bg-card px-3 py-2 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25 transition-colors">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            send()
          }
        }}
        rows={1}
        placeholder={disabled ? 'The advisor is unavailable' : 'Ask anything about your money…'}
        disabled={disabled}
        aria-label="Message the advisor"
        className="flex-1 resize-none bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60 max-h-[200px]"
      />
      {streaming ? (
        <button
          type="button"
          onClick={onStop}
          className="h-8 w-8 shrink-0 rounded-lg bg-accent text-foreground hover:bg-accent/80 flex items-center justify-center transition-colors"
          aria-label="Stop generating"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </button>
      ) : (
        <button
          type="button"
          onClick={send}
          disabled={!value.trim() || disabled}
          className="h-8 w-8 shrink-0 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-colors"
          aria-label="Send"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
