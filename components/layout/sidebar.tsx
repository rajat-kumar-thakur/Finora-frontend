/**
 * Sidebar Navigation
 * 
 * Main navigation component for the finance dashboard.
 * Provides navigation structure for finance-related features.
 */

"use client"

import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  TrendingUp,
  Target,
  CreditCard,
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
} from "lucide-react"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { clearTokens } from "@/lib/api/auth"

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

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
          "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
          isActive
            ? "bg-gray-100 dark:bg-[#1F1F23] text-gray-900 dark:text-white font-medium"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23]",
          disabled && "opacity-50 cursor-not-allowed",
          isCollapsed && "justify-center"
        )}
        aria-disabled={disabled}
        title={isCollapsed ? children?.toString() : undefined}
      >
        <Icon className={cn("h-4 w-4 flex-shrink-0", !isCollapsed && "mr-3")} />
        {!isCollapsed && children}
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-[70] p-2 rounded-lg bg-white dark:bg-[#0F0F12] shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-[70] bg-white dark:bg-[#0F0F12] transform transition-all duration-200 ease-in-out border-r border-gray-200 dark:border-[#1F1F23]",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-16" : "w-64"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo/Brand */}
          <div className="h-16 border-b border-gray-200 dark:border-[#1F1F23] flex items-center justify-center relative px-3">
            <Link href="/dashboard" className={cn("flex items-center hover:opacity-80 transition-opacity", isCollapsed ? "flex-col gap-0.5" : "gap-3 mr-auto")}>
              <Image src="/icon.png" alt="Finora" width={32} height={32} className="w-8 h-8 rounded-lg" />
              <span className={cn("font-semibold text-gray-900 dark:text-white", isCollapsed ? "text-[9px] leading-none" : "text-lg")}>
                Finora
              </span>
            </Link>
            {/* Collapse toggle for desktop */}
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#1F1F23] text-gray-600 dark:text-gray-300 transition-colors"
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
                className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23] hover:bg-gray-50 dark:hover:bg-[#1F1F23] text-gray-600 dark:text-gray-300 transition-colors shadow-md z-50"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-6">
              {/* Main Navigation */}
              <div>
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
                  <NavItem href="/categories" icon={FolderKanban}>
                    Categories
                  </NavItem>
                </div>
              </div>

              {/* Financial Planning */}
              <div>
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
                  <NavItem href="/goals" icon={TrendingUp} disabled>
                    Goals
                  </NavItem>
                </div>
              </div>

              {/* Coming Soon */}
              <div>
                {!isCollapsed && (
                  <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Coming Soon
                  </div>
                )}
                <div className="space-y-1">
                  <NavItem href="/accounts" icon={Wallet} disabled>
                    Accounts
                  </NavItem>
                  <NavItem href="/cards" icon={CreditCard} disabled>
                    Cards
                  </NavItem>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Footer */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-[#1F1F23]">
            <div className="space-y-1">
              <NavItem href="/settings" icon={Settings} disabled>
                Settings
              </NavItem>
              <NavItem href="/help" icon={HelpCircle} disabled>
                Help
              </NavItem>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23]",
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

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[65] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
