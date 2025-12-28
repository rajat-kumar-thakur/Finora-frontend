/**
 * Login Page
 * 
 * Placeholder for authentication implementation.
 * Will be connected to FastAPI backend in auth phase.
 */

import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0F0F12] px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Finora
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Smart Modern Finance Tracker
          </p>
        </div>

        <div className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23] rounded-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Sign In
          </h2>

          <div className="space-y-4">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
              Authentication not yet implemented
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Don&apos;t have an account?{' '}
              <Link 
                href="/signup" 
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Phase 0 - Foundation Layer
        </p>
      </div>
    </div>
  )
}
