/**
 * Root Page
 * 
 * Redirects to the main dashboard.
 * In production, this could redirect to login if not authenticated.
 */

import { redirect } from "next/navigation"

export default function Home() {
  // TODO: Add auth check - redirect to /login if not authenticated
  redirect("/dashboard")
}
