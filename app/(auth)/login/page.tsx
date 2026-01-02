/**
 * Login Page
 * 
 * User authentication with email and password.
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { login, type LoginData } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { isAuthenticated } from '@/lib/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(formData)
      // Redirect to the intended page or dashboard
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      window.location.href = redirectTo
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Invalid email or password')
        } else if (err.status === 403) {
          setError('Your account has been disabled')
        } else {
          setError('Login failed. Please try again.')
        }
      } else {
        setError('Network error. Please check your connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0F0F12] px-4 overflow-hidden">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/icon.png" alt="Finora" className="w-8 h-8 rounded-lg" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Finora
          </h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Smart Modern Finance Tracker
          </p>
        </div>

        <div className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#1F1F23] rounded-lg bg-white dark:bg-[#0F0F12] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#1F1F23] rounded-lg bg-white dark:bg-[#0F0F12] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Don&apos;t have an account?{' '}
              <Link 
                href="/signup" 
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0F0F12] overflow-hidden">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}