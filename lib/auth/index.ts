/**
 * Auth Context & Utilities
 * 
 * Client-side authentication state management and utilities.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getAccessToken, 
  clearTokens, 
  getCurrentUserProfile,
  type UserProfile 
} from '@/lib/api/auth'

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null
}

/**
 * Get current user data from API
 * Returns null if not authenticated or on error
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    if (!isAuthenticated()) {
      return null
    }

    return await getCurrentUserProfile()
  } catch {
    return null
  }
}

/**
 * Auth guard for protected routes
 * Redirects to login if not authenticated
 */
export function requireAuth(): void {
  if (typeof window !== 'undefined' && !isAuthenticated()) {
    window.location.href = '/login'
  }
}

/**
 * Logout user and redirect to login
 */
export async function logoutUser(): Promise<void> {
  clearTokens()
  
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

/**
 * Hook to get current user profile
 */
export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await getCurrentUser()
        setUser(userData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load user'))
      } finally {
        setLoading(false)
      }
    }
    
    loadUser()
  }, [])
  
  return { user, loading, error }
}

/**
 * Hook for protected routes
 * Redirects to login if not authenticated
 */
export function useRequireAuth() {
  const router = useRouter()
  const authenticated = isAuthenticated()
  
  useEffect(() => {
    if (!authenticated) {
      router.push('/login')
    }
  }, [authenticated, router])
  
  return authenticated
}
