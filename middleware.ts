/**
 * Authentication Middleware
 * 
 * Simple route protection - client components handle detailed auth checks.
 * Since we use localStorage for tokens, server middleware has limited visibility.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // For protected routes, let the client-side layout handle auth
  // This middleware just ensures proper routing structure
  // The actual auth check happens in the dashboard layout component
  
  return NextResponse.next()
}

// Configure which routes should run the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
