import { cn } from "@/lib/utils"

/**
 * Skeleton loading placeholder — graphite base with a shimmer sweep.
 * Style lives in the `skeleton` utility (app/globals.css).
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("skeleton", className)} {...props} />
}
