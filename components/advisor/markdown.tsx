"use client"

/**
 * Advisor Markdown — assistant replies rendered with Terminal Pro styling.
 *
 * Locked down on purpose: no raw HTML (no rehype-raw), no images, and links
 * only to http(s) or same-origin paths. Replies can echo text from bank
 * statements, so a prompt-injected image/link must not be able to phone home.
 */

import { memo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

function safeUrl(url: string): string {
  // Browsers normalise "\" to "/" and strip tabs/newlines, so "/\evil.com"
  // or "/<TAB>/evil.com" would resolve off-site — reject them outright.
  if (/[\\\s\u0000-\u001f\u007f]/.test(url)) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (!url.startsWith('/') || url.startsWith('//')) return ''
  // Same-origin path: confirm it really resolves to this origin.
  if (typeof window === 'undefined') return url
  try {
    return new URL(url, window.location.origin).origin === window.location.origin ? url : ''
  } catch {
    return ''
  }
}

const components: Components = {
  p: ({ children }) => <p className="leading-relaxed [&:not(:first-child)]:mt-3">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ href, children }) => {
    const external = !!href && /^https?:\/\//i.test(href)
    return (
      <a
        href={href || undefined}
        className="text-primary underline underline-offset-2 hover:no-underline"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    )
  },
  h1: ({ children }) => <h3 className="text-base font-semibold text-foreground mt-4 first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="text-base font-semibold text-foreground mt-4 first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="text-sm font-semibold text-foreground mt-4 first:mt-0">{children}</h4>,
  h4: ({ children }) => <h4 className="text-sm font-semibold text-foreground mt-3 first:mt-0">{children}</h4>,
  ul: ({ children }) => <ul className="mt-2 space-y-1 list-disc pl-5 marker:text-muted-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 space-y-1 list-decimal pl-5 marker:text-muted-foreground">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-3 border-l-2 border-primary/50 pl-3 text-muted-foreground">{children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-border" />,
  code: ({ children }) => (
    <code className="font-mono text-[0.85em] px-1 py-0.5 rounded bg-surface-raised">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mt-3 overflow-x-auto rounded-md bg-surface-raised p-3 text-xs">{children}</pre>
  ),
  table: ({ children }) => (
    <div className="mt-3 overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-raised text-muted-foreground">{children}</thead>,
  th: ({ children, style }) => (
    <th style={style} className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">{children}</th>
  ),
  td: ({ children, style }) => (
    <td style={style} className="px-3 py-2 border-t border-border font-numeric">{children}</td>
  ),
}

export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="text-sm text-foreground/90 break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={['img']}
        unwrapDisallowed
        urlTransform={safeUrl}
        components={components}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
})
