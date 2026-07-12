/**
 * Sidebar Navigation
 * 
 * Main navigation component for the finance dashboard.
 * Provides navigation structure for finance-related features.
 */

"use client"

import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Target,
  Settings,
  HelpCircle,
  Menu,
  Upload,
  FolderKanban,
  BarChart3,
  LogOut,
  Award,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Shield,
  Landmark,
  Wallet,
} from "lucide-react"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { clearTokens } from "@/lib/api/auth"
import { useUser } from "@/lib/auth"

interface SidebarProps {
  isMobileMenuOpen?: boolean
  setIsMobileMenuOpen?: (open: boolean) => void
}

export default function Sidebar({ isMobileMenuOpen: externalOpen, setIsMobileMenuOpen: setExternalOpen }: SidebarProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const isAdmin = user?.is_admin ?? false

  // Use external state if provided, otherwise use internal state
  const isMobileMenuOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setIsMobileMenuOpen = setExternalOpen || setInternalOpen

  // Update CSS variable when collapsed state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '64px' : '256px')
    }
  }, [isCollapsed])

  function handleNavigation() {
    setIsMobileMenuOpen(false)
  }

  function handleLogout() {
    clearTokens()
    router.push('/login')
  }

  function NavItem({
    href,
    icon: Icon,
    children,
    disabled = false,
  }: {
    href: string
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
    disabled?: boolean
  }) {
    const isActive = pathname === href
    
    return (
      <Link
        href={disabled ? "#" : href}
        onClick={handleNavigation}
        className={cn(
          "relative flex items-center px-3 py-2 text-sm rounded-md transition-colors",
          isActive
            ? "bg-primary/10 text-sidebar-foreground font-medium"
            : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
          disabled && "opacity-50 cursor-not-allowed",
          isCollapsed && "justify-center"
        )}
        aria-disabled={disabled}
        aria-current={isActive ? "page" : undefined}
        title={isCollapsed ? children?.toString() : undefined}
      >
        {isActive && (
          <span aria-hidden className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
        )}
        <Icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-primary", !isCollapsed && "mr-3")} />
        {!isCollapsed && children}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile hamburger menu button */}
      <button
        type="button"
        className="lg:hidden fixed top-[calc(0.5rem+env(safe-area-inset-top))] left-4 z-[70] p-2.5 rounded-xl bg-card shadow-lg border border-border active:scale-95 transition-transform touch-target"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>
      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-[70] bg-sidebar transform transition-all duration-200 ease-in-out border-r border-sidebar-border",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-16" : "w-64"
        )}
      >
        <div className="h-full flex flex-col min-h-0 pt-[env(safe-area-inset-top)]">
          {/* Logo/Brand */}
          <div className="h-16 flex-shrink-0 border-b border-sidebar-border flex items-center justify-center relative px-3">
            <Link href="/dashboard" className={cn("flex items-center hover:opacity-80 transition-opacity", isCollapsed ? "justify-center" : "gap-3 mr-auto")}>
              <Image src="/icon.png" alt="Finora" width={32} height={32} className="w-8 h-8 rounded-lg" />
              {!isCollapsed && (
                <span className="font-semibold text-sidebar-foreground tracking-tight text-lg">
                  Finora
                </span>
              )}
            </Link>
            {/* Collapse toggle for desktop */}
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {/* Expand button when collapsed */}
            {isCollapsed && (
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-sidebar border border-sidebar-border hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors shadow-md z-50"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Navigation - Scrollable */}
          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-6">
              {/* Main Navigation */}
              <div>
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Overview
                  </div>
                )}
                <div className="space-y-1">
                  <NavItem href="/dashboard" icon={LayoutDashboard}>
                    Dashboard
                  </NavItem>
                  <NavItem href="/upload" icon={Upload}>
                    Upload
                  </NavItem>
                  <NavItem href="/transactions" icon={ArrowLeftRight}>
                    Transactions
                  </NavItem>
                  <NavItem href="/accounts" icon={Wallet}>
                    Accounts
                  </NavItem>
                  <NavItem href="/categories" icon={FolderKanban}>
                    Categories
                  </NavItem>
                </div>
              </div>

              {/* Investments & Assets */}
              <div>
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Investments
                  </div>
                )}
                <div className="space-y-1">
                  <NavItem href="/investments" icon={TrendingUp}>
                    Portfolio
                  </NavItem>
                  <NavItem href="/fixed-deposits" icon={Landmark}>
                    Fixed Deposits
                  </NavItem>
                </div>
              </div>

              {/* Financial Planning */}
              <div>
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Analytics
                  </div>
                )}
                <div className="space-y-1">
                  <NavItem href="/insights" icon={BarChart3}>
                    Insights
                  </NavItem>
                  <NavItem href="/budgets" icon={Target}>
                    Budgets
                  </NavItem>
                  <NavItem href="/finance-score" icon={Award}>
                    Finance Score
                  </NavItem>
                  <NavItem href="/recurring-payments" icon={Repeat}>
                    Recurring Bills
                  </NavItem>
                </div>
              </div>

              {/* Admin Section - Only visible to admins */}
              {isAdmin && (
                <div>
                  {!isCollapsed && (
                    <div className="px-3 mb-2 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Admin
                    </div>
                  )}
                  <div className="space-y-1">
                    <NavItem href="/admin/waitlist" icon={Shield}>
                      Waitlist
                    </NavItem>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Settings Footer */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-sidebar-border safe-area-inset-bottom">
            <div className="space-y-1">
              <NavItem href="/settings" icon={Settings}>
                Settings
              </NavItem>
              <NavItem href="/help" icon={HelpCircle}>
                Help
              </NavItem>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? "Logout" : undefined}
              >
                <LogOut className={cn("h-4 w-4 flex-shrink-0", !isCollapsed && "mr-3")} />
                {!isCollapsed && "Logout"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay with animation */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] lg:hidden transition-opacity duration-200",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />
    </>
  )
}
