/**
 * Environment Configuration
 * 
 * Centralized environment variable access for the application.
 * All environment-specific values should be accessed through this module.
 */

export const env = {
  /**
   * Backend API base URL
   * Defaults to localhost:8000 for local development
   */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',

  /**
   * Application environment
   */
  nodeEnv: process.env.NODE_ENV || 'development',

  /**
   * Whether the app is running in production
   */
  isProduction: process.env.NODE_ENV === 'production',

  /**
   * Whether the app is running in development
   */
  isDevelopment: process.env.NODE_ENV === 'development',
} as const

/**
 * Validate required environment variables
 * This should be called at application startup
 */
export function validateEnv(): void {
  // Add validation logic here as needed
  if (!env.apiBaseUrl) {
    console.warn('NEXT_PUBLIC_API_BASE_URL is not set, using default: http://localhost:8000')
  }
}
