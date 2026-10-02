"use client"

/**
 * AI Advisor — conversations rail, streamed chat and savings tips.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { History, Plus, Sparkles } from 'lucide-react'
import {
  advisorApi,
  type AdvisorMessage,
  type AdvisorThread,
  type ChartSpec,
  type TipsResponse,
} from '@/lib/api'
import { useUser } from '@/lib/auth'
import { getApiErrorMessage } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AssistantMessage, UserMessage, type ChatMessage } from '@/components/advisor/message'
import { Composer } from '@/components/advisor/composer'
import { ThreadList, relativeTime } from '@/components/advisor/thread-list'
import { TipsPanel } from '@/components/advisor/tips-panel'

const SUGGESTIONS = [
  'Where did my money go this month?',
  'Find subscriptions I could cancel',
  'Chart my monthly spending for the last 6 months',
  'Heatmap of my spending by weekday and category',
  'Am I on track for my goals?',
  'How could I save ₹5,000 more a month?',
]

function toChat(m: AdvisorMessage): ChatMessage {
  return { id: m.id, role: m.role, parts: m.parts, status: m.status, error: m.error ?? undefined }
}

function appendText(m: ChatMessage, delta: string): ChatMessage {
  const parts = [...m.parts]
  const last = parts[parts.length - 1]
  if (last && last.type === 'text') {
    parts[parts.length - 1] = { ...last, text: (last.text ?? '') + delta }
  } else {
    parts.push({ type: 'text', text: delta })
  }
  return { ...m, parts }
}

function appendChart(m: ChatMessage, spec: ChartSpec): ChatMessage {
  return { ...m, parts: [...m.parts, { type: 'chart', chart: spec }] }
}

export function AdvisorView() {
  const { user } = useUser()
  const { toast } = useToast()
  const [threads, setThreads] = useState<AdvisorThread[]>([])
  const [tips, setTips] = useState<TipsResponse | null>(null)
  const [booting, setBooting] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingThread, setLoadingThread] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [statusLabel, setStatusLabel] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  // Bumped on every thread switch / new chat so a late thread load is dropped.
  const loadToken = useRef(0)

  const onTipsUpdate = useCallback((res: TipsResponse) => setTips(res), [])

  const enabled = tips?.enabled ?? true
  const firstName = user?.full_name?.split(' ')[0]

  const reloadThreads = useCallback(async () => {
    try {
      setThreads(await advisorApi.threads())
    } catch {
      // keep the current list
    }
  }, [])

  useEffect(() => {
    Promise.allSettled([advisorApi.threads(), advisorApi.tips()]).then(([t, s]) => {
      if (t.status === 'fulfilled') setThreads(t.value)
      setTips(s.status === 'fulfilled' ? s.value : { tips: [], generated_at: null, stale: false, enabled: true })
      setBooting(false)
    })
    return () => abortRef.current?.abort()
  }, [])

  // Follow the reply as it streams, unless the user scrolled up to read.
  useEffect(() => {
    const el = scrollRef.current
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
  }, [messages, statusLabel])

  const onScroll = () => {
    const el = scrollRef.current
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  const stop = () => abortRef.current?.abort()

  const newChat = () => {
    stop()
    loadToken.current += 1
    setActiveId(null)
    setMessages([])
    setLoadingThread(false)
  }

  const selectThread = async (id: string) => {
    if (id === activeId) return
    stop()
    const token = ++loadToken.current
    setActiveId(id)
    setMessages([])
    setLoadingThread(true)
    try {
      const detail = await advisorApi.thread(id)
      if (token !== loadToken.current) return // user moved on
      setMessages(detail.messages.map(toChat))
      stickToBottom.current = true
    } catch (err) {
      if (token !== loadToken.current) return
      toast({ title: "Couldn't open conversation", description: getApiErrorMessage(err), variant: 'destructive' })
      setActiveId(null)
    } finally {
      if (token === loadToken.current) setLoadingThread(false)
    }
  }

  const deleteThread = async (id: string) => {
    try {
      await advisorApi.deleteThread(id)
      setThreads((ts) => ts.filter((t) => t.id !== id))
      if (id === activeId) newChat()
    } catch (err) {
      toast({ title: "Couldn't delete conversation", description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const send = async (text: string) => {
    if (streaming || !text.trim()) return
    const stamp = Date.now()
    const pendingId = `pending-${stamp}`
    const update = (fn: (m: ChatMessage) => ChatMessage) =>
      setMessages((ms) => ms.map((m) => (m.id === pendingId ? fn(m) : m)))

    setMessages((ms) => [
      ...ms,
      { id: `local-${stamp}`, role: 'user', parts: [{ type: 'text', text }], status: 'complete' },
      { id: pendingId, role: 'assistant', parts: [], status: 'streaming' },
    ])
    stickToBottom.current = true
    setStreaming(true)
    setStatusLabel(null)
    const controller = new AbortController()
    abortRef.current = controller
    let threadId = activeId

    try {
      await advisorApi.streamChat(
        { message: text, thread_id: activeId ?? undefined },
        {
          onThread: (t) => {
            if (!threadId) {
              threadId = t.id
              setActiveId(t.id)
              const now = new Date().toISOString()
              setThreads((ts) => [{ id: t.id, title: t.title, created_at: now, updated_at: now }, ...ts])
            }
          },
          onStatus: (label) => setStatusLabel(label),
          onText: (delta) => {
            setStatusLabel(null)
            update((m) => appendText(m, delta))
          },
          onChart: (spec) => {
            setStatusLabel(null)
            update((m) => appendChart(m, spec))
          },
          onError: (message) => update((m) => ({ ...m, status: 'error', error: message })),
          onDone: ({ status }) =>
            update((m) => (m.status === 'error' ? m : { ...m, status })),
        },
        controller.signal
      )
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        update((m) => ({ ...m, status: 'incomplete' }))
      } else {
        update((m) => ({ ...m, status: 'error', error: getApiErrorMessage(err, "Couldn't reach the advisor") }))
      }
    } finally {
      update((m) => (m.status === 'streaming' ? { ...m, status: 'complete' } : m))
      setStreaming(false)
      setStatusLabel(null)
      if (abortRef.current === controller) abortRef.current = null
      reloadThreads()
    }
  }

  const activeThread = threads.find((t) => t.id === activeId)
  const showWelcome = !activeId && messages.length === 0

  return (
    <div className="mx-auto flex w-full max-w-[96rem] h-[calc(100dvh-8.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] lg:h-[calc(100dvh-4rem-env(safe-area-inset-top))]">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border p-4">
        <ThreadList
          threads={threads}
          activeId={activeId}
          onSelect={selectThread}
          onNew={newChat}
          onDelete={deleteThread}
        />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {/* Mobile: history + new chat */}
        <div className="lg:hidden flex items-center gap-2 border-b border-border px-4 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="inline-flex items-center gap-1.5 text-sm text-foreground/90 px-2 py-1.5 rounded-md hover:bg-accent min-w-0">
                <History className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{activeThread?.title ?? 'History'}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto">
              <DropdownMenuLabel>Conversations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {threads.length === 0 && (
                <div className="px-2 py-2 text-xs text-muted-foreground">No conversations yet.</div>
              )}
              {threads.map((t) => (
                <DropdownMenuItem key={t.id} onSelect={() => selectThread(t.id)} className="flex-col items-start gap-0">
                  <span className="truncate w-full text-sm">{t.title}</span>
                  <span className="text-[11px] text-muted-foreground">{relativeTime(t.updated_at)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={newChat}
            className="ml-auto inline-flex items-center gap-1 text-sm text-primary px-2 py-1.5 rounded-md hover:bg-accent"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New
          </button>
        </div>

        <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
            {booting ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96 max-w-full" />
              </div>
            ) : !enabled ? (
              <EmptyState
                icon={Sparkles}
                title="The advisor isn't set up yet"
                body="The server has no AI key configured. Once OPENAI_API_KEY is set on the backend, you can chat with your advisor here."
              />
            ) : showWelcome ? (
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="icon-box-lg">
                    <Sparkles className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                    {firstName ? `Hi ${firstName}, ` : ''}what would you like to know?
                  </h1>
                  <p className="text-sm text-muted-foreground max-w-xl">
                    I can read your transactions, budgets, goals and investments, spot patterns, find
                    savings and draw charts on demand. I can&apos;t change your data.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/90 hover:border-primary/50 hover:text-foreground transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Only on the welcome screen, so asking always starts a fresh thread */}
                {tips && (
                  <TipsPanel
                    initial={tips}
                    onAsk={send}
                    onUpdate={onTipsUpdate}
                  />
                )}
              </div>
            ) : loadingThread ? (
              <div className="space-y-6">
                <Skeleton className="h-10 w-2/3 ml-auto" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              messages.map((m) =>
                m.role === 'user' ? (
                  <UserMessage key={m.id} message={m} />
                ) : (
                  <AssistantMessage key={m.id} message={m} statusLabel={m.status === 'streaming' ? statusLabel : null} />
                )
              )
            )}
          </div>
        </div>

        <div className="border-t border-border/60 bg-background/80 backdrop-blur px-4 pt-3 pb-3">
          <div className="mx-auto max-w-3xl">
            <Composer onSend={send} onStop={stop} streaming={streaming} disabled={!enabled || booting} />
            <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
              Read-only access to your data · AI can make mistakes, so double-check important figures.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
