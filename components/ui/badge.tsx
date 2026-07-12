import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/60 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/25 bg-primary/10 text-primary",
        secondary:
          "border-border bg-surface-raised text-secondary-foreground",
        destructive:
          "border-destructive/25 bg-destructive/10 text-destructive",
        outline: "border-border text-foreground",
        warning:
          "border-warning/25 bg-warning/10 text-warning",
        positive:
          "border-positive/25 bg-positive/10 text-positive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
