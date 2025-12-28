/**
 * Placeholder Component
 * 
 * Generic placeholder for features not yet implemented.
 * Used to maintain visual structure while avoiding premature feature implementation.
 */

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface PlaceholderProps {
  icon?: LucideIcon
  title: string
  description?: string
  className?: string
}

export function Placeholder({ 
  icon: Icon, 
  title, 
  description = "This feature will be implemented in a future phase",
  className 
}: PlaceholderProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        "bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23] rounded-xl",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-[#1F1F23] rounded-full">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        {description}
      </p>
    </div>
  )
}
