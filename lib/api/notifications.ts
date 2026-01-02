/**
 * Notification API Client
 *
 * Type-safe API methods for notification operations.
 */

import { apiClient } from './client'

export type NotificationType =
  | 'budget_warning'
  | 'budget_exceeded'
  | 'low_balance'
  | 'bill_reminder'
  | 'finance_score'
  | 'spending_trend'
  | 'system'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  metadata: Record<string, unknown>
  is_read: boolean
  created_at: string
  read_at: string | null
}

export interface NotificationListResponse {
  notifications: Notification[]
  unread_count: number
  total: number
}

export const notificationApi = {
  /**
   * List notifications
   */
  list: async (options?: {
    unread_only?: boolean
    limit?: number
    offset?: number
  }): Promise<NotificationListResponse> => {
    const params: Record<string, string> = {}
    if (options?.unread_only) params.unread_only = 'true'
    if (options?.limit) params.limit = options.limit.toString()
    if (options?.offset) params.offset = options.offset.toString()

    return apiClient.get<NotificationListResponse>('/api/v1/notifications', { params })
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    return apiClient.get<{ unread_count: number }>('/api/v1/notifications/unread-count')
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<void> => {
    return apiClient.post<void>(`/api/v1/notifications/${id}/read`, {})
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    return apiClient.post<void>('/api/v1/notifications/read-all', {})
  },

  /**
   * Delete a notification
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/v1/notifications/${id}`)
  },
}
