/**
 * Admin API
 *
 * Endpoints for admin user management (waitlist approval).
 */

import { api } from './client'
import type { UserProfile } from './auth'

// ============================================================================
// Types
// ============================================================================

export interface PendingUsersResponse {
  users: UserProfile[]
  total: number
}

export interface UserStats {
  pending: number
  approved: number
  rejected: number
  total: number
  active: number
  disabled: number
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Get all users pending approval
 */
export async function getPendingUsers(
  skip = 0,
  limit = 50
): Promise<PendingUsersResponse> {
  return api.get<PendingUsersResponse>('/api/v1/admin/users/pending', {
    params: { skip, limit },
  })
}

/**
 * Get user count statistics
 */
export async function getUserStats(): Promise<UserStats> {
  return api.get<UserStats>('/api/v1/admin/users/stats')
}

/**
 * Get all users with optional status filter
 */
export async function getAllUsers(
  statusFilter?: string,
  skip = 0,
  limit = 50
): Promise<PendingUsersResponse> {
  const params: Record<string, string | number> = { skip, limit }
  if (statusFilter) {
    params.status_filter = statusFilter
  }
  return api.get<PendingUsersResponse>('/api/v1/admin/users', { params })
}

/**
 * Approve a user
 */
export async function approveUser(userId: string): Promise<UserProfile> {
  return api.post<UserProfile>(`/api/v1/admin/users/${userId}/approve`)
}

/**
 * Reject a user
 */
export async function rejectUser(userId: string): Promise<UserProfile> {
  return api.post<UserProfile>(`/api/v1/admin/users/${userId}/reject`)
}

/**
 * Enable or disable a user
 */
export async function toggleUserActive(
  userId: string,
  isActive: boolean
): Promise<UserProfile> {
  return api.post<UserProfile>(`/api/v1/admin/users/${userId}/toggle-active`, {
    is_active: isActive,
  })
}
