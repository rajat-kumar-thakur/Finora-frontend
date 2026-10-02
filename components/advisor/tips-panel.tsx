"use client"

/**
 * Savings tips generated from the user's own patterns. Cached server-side and
 * shown as-is; new tips are generated only when the user asks (each run spends
 * an advisor request), never automatically.
 */

import { useCallback, useState } from 'react'
import { Lightbulb, MessageCircle, RefreshCw } from 'lucide-react'
import { advisorApi, type Tip, type TipsResponse } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/utils'

function formatSaving(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

/**
 * The panel remounts every time the welcome screen reappears ("New chat"), so
 * the parent keeps the latest tips (`onUpdate`) to seed the next mount.
 */
export function TipsPanel({
  initial,
  onAsk,
  onUpdate,
}: {
  initial: TipsResponse
  onAsk: (prompt: string) => void
  onUpdate: (tips: TipsResponse) => void
}) {
  const [tips, setTips] = useState<Tip[]>(initial.tips)
  const [generated, setGenerated] = useState(initial.generated_at != null)
  const [stale, setStale] = useState(initial.stale)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const res = await advisorApi.refreshTips()
      setTips(res.tips)
      setGenerated(true)
      setStale(false)
      onUpdate(res)
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't refresh tips"))
    } finally {
      setRefreshing(false)
    }
  }, [onUpdate])

  if (!initial.enabled) return null

  const loadingFirst = refreshing && tips.length === 0

  return (
    <section aria-labelledby="tips-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="tips-heading" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lightbulb className="h-4 w-4 text-warning" aria-hidden="true" />
          Ways to save
        </h2>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-60 px-2 py-1 rounded-md hover:bg-accent transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          {refreshing ? 'Analysing…' : generated ? 'Refresh' : 'Generate'}
        </button>
      </div>

      {error && <p className="text-xs text-negative">{error}</p>}
      {stale && tips.length > 0 && !refreshing && (
        <p className="text-xs text-muted-foreground">
          Based on older data — refresh for ideas that include your latest transactions.
        </p>
      )}

      {loadingFirst ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-base p-4 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          ))}
        </div>
      ) : tips.length === 0 ? (
        !error && (
          <p className="text-sm text-muted-foreground">
            {generated
              ? 'Not enough recent spending to spot patterns yet. Upload a statement and check back.'
              : 'Generate personalised ideas from your recent spending. Each run uses one advisor request.'}
          </p>
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tips.map((tip) => (
            <article key={tip.title} className="card-base p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium text-foreground">{tip.title}</h3>
                {tip.est_monthly_saving != null && tip.est_monthly_saving > 0 && (
                  <span className="shrink-0 rounded-md bg-positive/12 text-positive px-2 py-0.5 text-xs font-medium font-numeric whitespace-nowrap">
                    ~{formatSaving(tip.est_monthly_saving)}/mo
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground/85">{tip.detail}</p>
              <p className="text-xs text-muted-foreground">{tip.evidence}</p>
              <div className="mt-auto pt-1 flex items-center justify-between gap-2">
                {tip.category_name ? (
                  <span className="text-[11px] text-muted-foreground rounded bg-accent px-1.5 py-0.5 truncate">
                    {tip.category_name}
                  </span>
                ) : <span />}
                <button
                  type="button"
                  onClick={() => onAsk(tip.ask_prompt)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-2"
                >
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Ask about this
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
