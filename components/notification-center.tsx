"use client"

/**
 * Notification Center Component
 *
 * Bell icon dropdown with notifications list.
 */

import { useState, useEffect, useRef } from 'react'
import { notificationApi, type Notification, type NotificationType } from '@/lib/api/notifications'
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  TrendingDown,
  Target,
  CreditCard,
  BarChart3,
  Info,
} from 'lucide-react'

const notificationIcons: Record<NotificationType, React.ElementType> = {
  budget_warning: Target,
  budget_exceeded: AlertTriangle,
  low_balance: TrendingDown,
  bill_reminder: CreditCard,
  finance_score: BarChart3,
  spending_trend: TrendingDown,
  system: Info,
}

const notificationColors: Record<NotificationType, string> = {
  budget_warning: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
  budget_exceeded: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  low_balance: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  bill_reminder: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  finance_score: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  spending_trend: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
  system: 'text-gray-500 bg-gray-100 dark:bg-gray-900/30',
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch unread count on mount
    fetchUnreadCount()

    // Poll for new notifications every 5 seconds
    const interval = setInterval(fetchUnreadCount, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationApi.getUnreadCount()
      setUnreadCount(data.unread_count)
    } catch {
      // Silently fail
    }
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const data = await notificationApi.list({ limit: 20 })
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications()
    }
    setIsOpen(!isOpen)
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // Silently fail
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
      setUnreadCount(0)
    } catch {
      // Silently fail
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-foreground/60 hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-medium bg-red-500 text-white rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-lg shadow-lg z-[100] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type] || Info
                  const colorClass = notificationColors[notification.type] || notificationColors.system

                  return (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-muted/50 transition-colors ${
                        !notification.is_read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 p-2 rounded-full ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium text-foreground ${!notification.is_read ? '' : 'opacity-80'}`}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="flex-shrink-0 p-1 text-muted-foreground hover:text-primary rounded transition-colors"
                                title="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-muted/30">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
