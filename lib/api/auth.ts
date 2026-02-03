/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls and token management.
 */

import { api, apiClient } from './client'

// ============================================================================
// Types
// ============================================================================

export interface SignupData {
  email: string
  password: string
  full_name?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  created_at: string
  last_login: string | null
  role: string
  status: 'pending' | 'approved' | 'rejected'
  is_admin: boolean
}

export interface SignupResponse {
  message: string
  status: 'pending' | 'approved'
  user_id: string
}

// ============================================================================
// Token Storage (Secure)
// ============================================================================

const TOKEN_STORAGE_KEY = 'finora_access_token'
const REFRESH_TOKEN_STORAGE_KEY = 'finora_refresh_token'

/**
 * Store authentication tokens securely
 * Note: Using localStorage for simplicity. In production, consider:
 * - HTTP-only cookies for tokens
 * - Secure cookie flags
 * - SameSite settings
 */
export function storeTokens(accessToken: string, refreshToken: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken)
  }
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  }
  return null
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  }
  return null
}

/**
 * Clear stored tokens
 */
export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  }
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Register a new user
 *
 * New users are placed on a waitlist and must be approved by an admin.
 * Returns a SignupResponse with status instead of tokens.
 */
export async function signup(data: SignupData): Promise<SignupResponse> {
  const response = await api.post<SignupResponse>('/api/v1/auth/signup', data)
  // No tokens are returned - user must wait for approval
  return response
}

/**
 * Authenticate user
 */
export async function login(data: LoginData): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>('/api/v1/auth/login', data)
  
  // Store tokens
  storeTokens(response.access_token, response.refresh_token)
  
  return response
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<TokenResponse> {
  const refreshToken = getRefreshToken()
  
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }
  
  const response = await api.post<TokenResponse>('/api/v1/auth/refresh', {
    refresh_token: refreshToken
  })
  
  // Store new tokens
  storeTokens(response.access_token, response.refresh_token)
  
  return response
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/api/v1/auth/logout')
  } finally {
    // Always clear tokens, even if API call fails
    clearTokens()
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
  return api.get<UserProfile>('/api/v1/users/me')
}

// ============================================================================
// Initialize API Client with Token Getter
// ============================================================================

// Set the auth token getter on the API client
apiClient.setAuthTokenGetter(getAccessToken)
