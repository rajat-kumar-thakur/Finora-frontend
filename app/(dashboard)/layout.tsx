/**
 * Dashboard Layout
 * 
 * Layout wrapper for all dashboard routes.
 * Applies the authenticated dashboard layout with sidebar and top navigation.
 * Enforces authentication requirement.
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { isAuthenticated } from '@/lib/auth'

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  
  useEffect(() => {
    // Check authentication on mount
    if (!isAuthenticated()) {
      router.push('/login')
    }
  }, [router])
  
  // Don't render dashboard if not authenticated
  if (!isAuthenticated()) {
    return null
  }
  
  return <DashboardLayout>{children}</DashboardLayout>
}
