import { type LucideIcon } from "lucide-react"

/**
 * Standard empty state: lucide icon in a mint icon-box, title, body, optional CTA.
 * CTAs passed as children must reuse existing handlers/links only.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: LucideIcon
  title: string
  body?: string
  children?: React.ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="icon-box-lg mb-4">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {body && <p className="empty-state-text">{body}</p>}
      {children && (
        <div className="mt-4 flex items-center justify-center gap-2">{children}</div>
      )}
    </div>
  )
}
