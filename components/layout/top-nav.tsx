/**
 * Top Navigation Bar
 * 
 * Header component with breadcrumbs, notifications, and user profile.
 */

"use client"

import { useEffect, useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, ChevronRight } from "lucide-react"
import Profile from "@/components/layout/profile"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { getCurrentUserProfile, type UserProfile, getAccessToken } from "@/lib/api/auth"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface TopNavProps {
  breadcrumbs?: BreadcrumbItem[]
}

export default function TopNav({ breadcrumbs = [] }: TopNavProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  
  useEffect(() => {
    async function loadUser() {
      try {
        // Only load user if authenticated with a valid token
        const token = getAccessToken()
        if (!token || token.trim() === '') {
          return
        }
        
        const profile = await getCurrentUserProfile()
        setUser(profile)
      } catch {
        // Silently fail - user might not be logged in or token is invalid
        // Don't log to console to avoid cluttering the console
      }
    }
    
    loadUser()
  }, [])

  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }
    return email[0].toUpperCase()
  }

  const initials = user ? getInitials(user.full_name, user.email) : 'U'

  const defaultBreadcrumbs: BreadcrumbItem[] = breadcrumbs.length > 0 
    ? breadcrumbs 
    : [{ label: "Dashboard" }]

  return (
    <nav className="px-3 sm:px-6 flex items-center justify-between bg-white dark:bg-[#0F0F12] border-b border-gray-200 dark:border-[#1F1F23] h-full">
      <div className="font-medium text-sm hidden sm:flex items-center space-x-1 truncate max-w-[300px]">
        {defaultBreadcrumbs.map((item, index) => (
          <div key={item.label} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 mx-1" />}
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-gray-100">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto sm:ml-0">
        <button
          type="button"
          className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-[#1F1F23] rounded-full transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
        </button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium ring-2 ring-gray-200 dark:ring-[#2B2B30] cursor-pointer">
              {initials}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[280px] sm:w-80 bg-background border-border rounded-lg shadow-lg"
          >
            <Profile />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

