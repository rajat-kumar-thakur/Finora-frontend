/**
 * AI Advisor API Client
 *
 * Threads, tips and the streamed chat. The chat endpoint answers with
 * Server-Sent Events: thread · status · text · chart · error · done.
 */

import { apiClient } from './client'

export type ChartType =
  | 'bar' | 'horizontal_bar' | 'stacked_bar' | 'line' | 'area'
  | 'donut' | 'combo' | 'scatter' | 'heatmap'

export type ChartTone = 'auto' | 'positive' | 'negative' | 'primary' | 'warning'

export interface ChartSeries {
  column: string
  label: string
  kind: 'bar' | 'line' | 'area' | null
  tone: ChartTone
}

/** Wide-format rows: [x label, ...one value per series]. */
export interface ChartSpec {
  type: ChartType
  title: string
  subtitle: string | null
  value_format: 'inr' | 'percent' | 'number'
  x: string
  series: ChartSeries[]
  columns: string[]
  rows: (string | number | null)[][]
}

export interface MessagePart {
  type: 'text' | 'chart'
  text?: string | null
  chart?: ChartSpec | null
}

export type MessageStatus = 'complete' | 'incomplete' | 'error'

export interface AdvisorMessage {
  id: string
  thread_id: string
  role: 'user' | 'assistant'
  parts: MessagePart[]
  status: MessageStatus
  /** Why the reply failed; any partial answer stays in `parts`. */
  error?: string | null
  tools_used: string[]
  created_at: string
}

export interface AdvisorThread {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ThreadDetail {
  thread: AdvisorThread
  messages: AdvisorMessage[]
}

export interface Tip {
  title: string
  detail: string
  category_name: string | null
  est_monthly_saving: number | null
  evidence: string
  ask_prompt: string
}

export interface TipsResponse {
  tips: Tip[]
  generated_at: string | null
  stale: boolean
  enabled: boolean
}

export interface ChatHandlers {
  onThread?: (thread: { id: string; title: string }) => void
  onStatus?: (label: string) => void
  onText?: (delta: string) => void
  onChart?: (spec: ChartSpec) => void
  onError?: (message: string) => void
  onDone?: (done: { message_id: string; status: MessageStatus }) => void
}

export const advisorApi = {
  threads: () => apiClient.get<AdvisorThread[]>('/api/v1/advisor/threads'),

  thread: (id: string) => apiClient.get<ThreadDetail>(`/api/v1/advisor/threads/${id}`),

  deleteThread: (id: string) => apiClient.delete<void>(`/api/v1/advisor/threads/${id}`),

  tips: () => apiClient.get<TipsResponse>('/api/v1/advisor/tips'),

  refreshTips: () => apiClient.post<TipsResponse>('/api/v1/advisor/tips/refresh'),

  /**
   * Send a message and dispatch the streamed reply to `handlers`.
   * Resolves when the stream ends; rejects with ApiError for pre-stream
   * failures (404/429/503…) and with an AbortError when `signal` aborts.
   */
  streamChat: async (
    body: { message: string; thread_id?: string },
    handlers: ChatHandlers,
    signal?: AbortSignal
  ): Promise<void> => {
    const payload: { message: string; thread_id?: string } = { message: body.message }
    if (body.thread_id) payload.thread_id = body.thread_id

    const response = await apiClient.stream('/api/v1/advisor/chat', payload, signal)
    if (!response.body) throw new Error('Streaming is not supported in this browser')

    const reader = response.body.getReader()
    // stream: true — "₹" is 3 bytes in UTF-8 and can straddle two chunks.
    const decoder = new TextDecoder()
    let buffer = ''

    const dispatch = (frame: string) => {
      let event = 'message'
      const data: string[] = []
      for (const line of frame.split('\n')) {
        if (!line || line.startsWith(':')) continue // heartbeat / comment
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
      }
      if (!data.length) return
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(data.join('\n'))
      } catch {
        return
      }
      switch (event) {
        case 'thread': handlers.onThread?.(parsed as { id: string; title: string }); break
        case 'status': handlers.onStatus?.(String(parsed.label ?? '')); break
        case 'text': handlers.onText?.(String(parsed.delta ?? '')); break
        case 'chart': handlers.onChart?.(parsed.spec as ChartSpec); break
        case 'error': handlers.onError?.(String(parsed.message ?? 'Something went wrong')); break
        case 'done': handlers.onDone?.(parsed as { message_id: string; status: MessageStatus }); break
      }
    }

    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        dispatch(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + 2)
        boundary = buffer.indexOf('\n\n')
      }
    }
    buffer += decoder.decode()
    if (buffer.trim()) dispatch(buffer)
  },
}
