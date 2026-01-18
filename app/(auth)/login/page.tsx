/**
 * Login Page
 *
 * User authentication with email and password.
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { login, type LoginData } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { isAuthenticated } from '@/lib/auth'
import { TrendingUp, PieChart, Shield, ArrowRight } from 'lucide-react'

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
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Branding & Features (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-background to-primary/5 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <Link href="/" className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity">
            <Image src="/icon.png" alt="Finora" width={48} height={48} className="rounded-xl" />
            <span className="text-3xl font-bold text-foreground">Finora</span>
          </Link>

          <h2 className="text-4xl xl:text-5xl font-bold text-foreground mb-4">
            Welcome back
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
            Sign in to continue managing your finances and tracking your financial goals.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="icon-box-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Track Net Worth</h3>
                <p className="text-sm text-muted-foreground">Monitor your total balance across all accounts in real-time</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="icon-box-lg">
                <PieChart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Smart Insights</h3>
                <p className="text-sm text-muted-foreground">Get detailed breakdowns of your spending by category</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="icon-box-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">Your financial data is encrypted and never shared</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <Image src="/icon.png" alt="Finora" width={48} height={48} className="rounded-xl" />
              <h1 className="text-2xl font-bold text-foreground">Finora</h1>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Sign in to your account</h2>
            <p className="text-muted-foreground mt-2">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:text-primary/80 font-medium">
                Sign up for free
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="alert-error">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label-base">
                Email address
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
                className="input-base"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label-base">
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
                className="input-base"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner-sm" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
