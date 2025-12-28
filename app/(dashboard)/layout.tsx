/**
 * Dashboard Layout
 * 
 * Layout wrapper for all dashboard routes.
 * Applies the authenticated dashboard layout with sidebar and top navigation.
 */

import { DashboardLayout } from '@/components/layout'

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
