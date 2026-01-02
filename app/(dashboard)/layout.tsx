/**
 * Dashboard Layout
 * 
 * Layout wrapper with sidebar navigation and authentication.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAccessToken, clearTokens } from '@/lib/api/auth'
import { NotificationCenter } from '@/components/notification-center'
import { ThemeToggle } from '@/components/theme-toggle'
import Sidebar from '@/components/layout/sidebar'

// Helper function to decode JWT token
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)
  const [userEmail, setUserEmail] = useState('user@finora.com')
  const [userName, setUserName] = useState('User')
  
  const token = typeof window !== 'undefined' ? getAccessToken() : null
  const isAuthenticated = token && token.trim() !== ''
  
  useEffect(() => {
    // Extract user info from token
    if (token) {
      const decoded = parseJwt(token)
      if (decoded) {
        setUserEmail(decoded.email || 'user@finora.com')
        // Extract name from email (part before @) or use full_name if available
        const emailName = decoded.email?.split('@')[0] || 'User'
        setUserName(decoded.full_name || emailName)
      }
    }
    
    // Initialize theme from localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark')
      } else {
        // Default to dark theme
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      }
    }
  }, [])
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else {
      setIsReady(true)
    }
  }, [isAuthenticated, router, pathname])
  
  if (!isAuthenticated || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }
  
  const handleLogout = () => {
    clearTokens()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Top Header Bar */}
      <header className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-width,256px)] z-40 h-16 bg-background/80 backdrop-blur-sm border-b border-border transition-all duration-200">
        <div className="h-full px-6 flex items-center justify-end gap-4">
          <ThemeToggle />
          <NotificationCenter />
        </div>
      </header>

      {/* Main Content - add margin to account for sidebar width and header */}
      <main className="lg:ml-[var(--sidebar-width,256px)] pt-16 transition-all duration-200">
        {children}
      </main>
    </div>
  )
}
