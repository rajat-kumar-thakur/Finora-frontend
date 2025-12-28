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
} from "lucide-react"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  function handleNavigation() {
    setIsMobileMenuOpen(false)
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
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-disabled={disabled}
      >
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        {children}
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
          "fixed inset-y-0 left-0 z-[70] w-64 bg-white dark:bg-[#0F0F12] transform transition-transform duration-200 ease-in-out",
          "lg:translate-x-0 lg:static lg:w-64 border-r border-gray-200 dark:border-[#1F1F23]",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo/Brand */}
          <div className="h-16 px-6 flex items-center border-b border-gray-200 dark:border-[#1F1F23]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Finora
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-6">
              {/* Main Navigation */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Overview
                </div>
                <div className="space-y-1">
                  <NavItem href="/dashboard" icon={LayoutDashboard}>
                    Dashboard
                  </NavItem>
                  <NavItem href="/accounts" icon={Wallet} disabled>
                    Accounts
                  </NavItem>
                  <NavItem href="/transactions" icon={ArrowLeftRight} disabled>
                    Transactions
                  </NavItem>
                </div>
              </div>

              {/* Financial Planning */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Planning
                </div>
                <div className="space-y-1">
                  <NavItem href="/budgets" icon={Target} disabled>
                    Budgets
                  </NavItem>
                  <NavItem href="/goals" icon={TrendingUp} disabled>
                    Goals
                  </NavItem>
                  <NavItem href="/insights" icon={TrendingUp} disabled>
                    Insights
                  </NavItem>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Payment
                </div>
                <div className="space-y-1">
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
