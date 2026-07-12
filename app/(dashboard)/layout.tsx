/**
 * Dashboard Layout
 *
 * Authenticated chrome: sidebar, top bar, main content, mobile nav.
 * Auth gate redirects to /login without a token. Theme is owned solely by
 * next-themes (root ThemeProvider, defaultTheme="dark").
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Settings as SettingsIcon } from 'lucide-react'
import { getAccessToken, clearTokens } from '@/lib/api/auth'
import { useUser } from '@/lib/auth'
import { NotificationCenter } from '@/components/notification-center'
import { ThemeToggle } from '@/components/theme-toggle'
import Sidebar from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/upload': 'Upload',
  '/transactions': 'Transactions',
  '/accounts': 'Accounts',
  '/categories': 'Categories',
  '/investments': 'Portfolio',
  '/fixed-deposits': 'Fixed Deposits',
  '/insights': 'Insights',
  '/budgets': 'Budgets',
  '/finance-score': 'Finance Score',
  '/recurring-payments': 'Recurring Bills',
  '/settings': 'Settings',
  '/help': 'Help',
  '/admin/waitlist': 'Waitlist',
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const [isReady, setIsReady] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const token = typeof window !== 'undefined' ? getAccessToken() : null
  const isAuthenticated = token && token.trim() !== ''

  const pageTitle = PAGE_TITLES[pathname] ?? ''

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else {
      setIsReady(true)
    }
  }, [isAuthenticated, router, pathname])

  function handleLogout() {
    clearTokens()
    router.push('/login')
  }

  if (!isAuthenticated || !isReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="spinner" />
      </div>
    )
  }

  const userInitial = (user?.email?.[0] ?? 'U').toUpperCase()

  return (
    <div className="min-h-dvh bg-background">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

      {/* Top Header Bar */}
      <header className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-width,256px)] z-40 bg-background/80 backdrop-blur-sm border-b border-border transition-all duration-200 pt-[env(safe-area-inset-top)]">
        <div className="h-14 lg:h-16 px-4 lg:px-6 flex items-center justify-between gap-3 lg:gap-4 pl-16 lg:pl-6">
          {/* Left: page context */}
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="hidden sm:inline text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              Finora /
            </span>
            <h1 className="text-sm font-semibold tracking-tight text-foreground truncate">
              {pageTitle}
            </h1>
          </div>

          {/* Right: theme, notifications, user */}
          <div className="flex items-center gap-2 lg:gap-3">
            <ThemeToggle />
            <NotificationCenter />
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary transition-colors hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                {userInitial}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user?.email && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <SettingsIcon className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        className="lg:ml-[var(--sidebar-width,256px)] pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-[calc(4rem+env(safe-area-inset-top))] transition-all duration-200 pb-20 lg:pb-0 overscroll-y-contain"
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav onMenuClick={() => setIsMobileMenuOpen(true)} />
    </div>
  )
}
