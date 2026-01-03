"use client"

/**
 * Mobile Bottom Navigation
 *
 * Bottom navigation bar for mobile devices with quick access to main features.
 */

import {
  LayoutDashboard,
  ArrowLeftRight,
  Upload,
  BarChart3,
  Menu,
} from "lucide-react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavItemProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  isActive: boolean
}

function NavItem({ href, icon: Icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all",
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}

interface MobileNavProps {
  onMenuClick?: () => void
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
    { href: "/upload", icon: Upload, label: "Upload" },
    { href: "/insights", icon: BarChart3, label: "Insights" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-lg border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
          />
        ))}
        <button
          type="button"
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl text-muted-foreground hover:text-foreground transition-all"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  )
}
