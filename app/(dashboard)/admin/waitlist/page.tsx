/**
 * Admin User Management Page
 *
 * Admin interface to view all users, approve/reject pending users,
 * and enable/disable user accounts.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useRequireAuth } from '@/lib/auth'
import {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  getUserStats,
  toggleUserActive,
} from '@/lib/api/admin'
import type { UserProfile } from '@/lib/api/auth'
import type { UserStats } from '@/lib/api/admin'
import {
  Check,
  X,
  Users,
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  Power,
  PowerOff,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TabType = 'all' | 'pending' | 'approved' | 'disabled'

export default function AdminWaitlistPage() {
  useRequireAuth()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<UserStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    active: 0,
    disabled: 0,
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('all')

  // Check if current user is admin
  const isAdmin = user?.is_admin ?? false

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let usersResponse
      if (activeTab === 'pending') {
        usersResponse = await getPendingUsers()
      } else if (activeTab === 'approved') {
        usersResponse = await getAllUsers('approved')
      } else if (activeTab === 'disabled') {
        const allUsers = await getAllUsers()
        usersResponse = {
          users: allUsers.users.filter((u) => !u.is_active),
          total: allUsers.users.filter((u) => !u.is_active).length,
        }
      } else {
        usersResponse = await getAllUsers()
      }
      setUsers(usersResponse.users)

      const statsResponse = await getUserStats()
      setStats(statsResponse)
    } catch (err) {
      console.error('Failed to load admin data:', err)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    if (!userLoading && user) {
      if (!isAdmin) {
        router.push('/dashboard')
      }
    }
  }, [userLoading, user, isAdmin, router])

  useEffect(() => {
    if (isAdmin && !userLoading && user) {
      loadData()
    }
  }, [isAdmin, userLoading, user, loadData])

  async function handleApprove(userId: string) {
    setActionLoading(userId)
    setError(null)
    try {
      const updatedUser = await approveUser(userId)
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? updatedUser : u))
      )
      setStats((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        approved: prev.approved + 1,
      }))
    } catch (err) {
      console.error('Failed to approve user:', err)
      setError('Failed to approve user. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(userId: string) {
    setActionLoading(userId)
    setError(null)
    try {
      const updatedUser = await rejectUser(userId)
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? updatedUser : u))
      )
      setStats((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        rejected: prev.rejected + 1,
      }))
    } catch (err) {
      console.error('Failed to reject user:', err)
      setError('Failed to reject user. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleToggleActive(userId: string, currentlyActive: boolean) {
    setActionLoading(userId)
    setError(null)
    try {
      const updatedUser = await toggleUserActive(userId, !currentlyActive)
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? updatedUser : u))
      )
      setStats((prev) => ({
        ...prev,
        active: currentlyActive ? prev.active - 1 : prev.active + 1,
        disabled: currentlyActive ? prev.disabled + 1 : prev.disabled - 1,
      }))
    } catch (err) {
      console.error('Failed to toggle user status:', err)
      setError('Failed to update user status. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  function parseUTCDate(dateString: string): Date {
    // Backend sends UTC timestamps without 'Z' suffix, so we need to add it
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
      return new Date(dateString + 'Z')
    }
    return new Date(dateString)
  }

  function formatLastLogin(lastLogin: string | null): string {
    if (!lastLogin) return 'Never'
    const date = parseUTCDate(lastLogin)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    // Explicitly format in IST
    return date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
  }

  function formatDateIST(dateString: string): string {
    const date = parseUTCDate(dateString)
    return date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
  }

  function getStatusBadge(userItem: UserProfile) {
    if (!userItem.is_active) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
          Disabled
        </span>
      )
    }
    switch (userItem.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            Pending
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  // Show loading while checking user
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    )
  }

  // Access denied for non-admins
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            Access Denied
          </p>
          <p className="text-muted-foreground">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    )
  }

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'all', label: 'All Users', count: stats.total },
    { id: 'pending', label: 'Pending', count: stats.pending },
    { id: 'approved', label: 'Approved', count: stats.approved },
    { id: 'disabled', label: 'Disabled', count: stats.disabled },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage user registrations and account access
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-[#2F2F33] text-foreground hover:bg-gray-50 dark:hover:bg-[#2F2F33] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-[#1F1F23] rounded-xl p-4 border border-gray-200 dark:border-[#2F2F33]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.pending}
              </p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1F1F23] rounded-xl p-4 border border-gray-200 dark:border-[#2F2F33]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.active}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1F1F23] rounded-xl p-4 border border-gray-200 dark:border-[#2F2F33]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.disabled}
              </p>
              <p className="text-sm text-muted-foreground">Disabled</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1F1F23] rounded-xl p-4 border border-gray-200 dark:border-[#2F2F33]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.total}
              </p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-[#2F2F33] mb-6">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'ml-2 py-0.5 px-2 rounded-full text-xs',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#1F1F23] rounded-xl border border-gray-200 dark:border-[#2F2F33] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="spinner mx-auto" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No users found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {activeTab === 'pending'
                ? 'No pending registration requests'
                : activeTab === 'disabled'
                  ? 'No disabled users'
                  : 'No users match this filter'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2F2F33] bg-gray-50 dark:bg-[#0F0F12]">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Last Login
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Signed Up
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#2F2F33]">
                {users.map((userItem) => (
                  <tr
                    key={userItem.id}
                    className="hover:bg-gray-50 dark:hover:bg-[#2F2F33]/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {userItem.full_name || 'No name'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {userItem.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(userItem)}</td>
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          'text-sm',
                          userItem.last_login
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {formatLastLogin(userItem.last_login)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDateIST(userItem.created_at)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Approve/Reject for pending users */}
                        {userItem.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(userItem.id)}
                              disabled={actionLoading === userItem.id}
                              title="Approve user"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {actionLoading === userItem.id ? (
                                <div className="spinner-sm" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(userItem.id)}
                              disabled={actionLoading === userItem.id}
                              title="Reject user"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {actionLoading === userItem.id ? (
                                <div className="spinner-sm" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                              Reject
                            </button>
                          </>
                        )}

                        {/* Enable/Disable toggle for approved users */}
                        {userItem.status === 'approved' && !userItem.is_admin && (
                          <button
                            onClick={() =>
                              handleToggleActive(userItem.id, userItem.is_active)
                            }
                            disabled={actionLoading === userItem.id}
                            title={
                              userItem.is_active
                                ? 'Disable user'
                                : 'Enable user'
                            }
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
                              userItem.is_active
                                ? 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                : 'border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                            )}
                          >
                            {actionLoading === userItem.id ? (
                              <div className="spinner-sm" />
                            ) : userItem.is_active ? (
                              <PowerOff className="w-3.5 h-3.5" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                            {userItem.is_active ? 'Disable' : 'Enable'}
                          </button>
                        )}

                        {/* Admin badge */}
                        {userItem.is_admin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
