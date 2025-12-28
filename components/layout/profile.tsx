/**
 * User Profile Dropdown
 * 
 * User profile menu with account information and navigation.
 */

import { LogOut, Settings, FileText, User } from "lucide-react"
import Link from "next/link"

interface MenuItem {
  label: string
  href: string
  icon: React.ReactNode
}

export default function Profile() {
  const menuItems: MenuItem[] = [
    {
      label: "Profile",
      href: "#",
      icon: <User className="w-4 h-4" />,
    },
    {
      label: "Settings",
      href: "#",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      label: "Privacy Policy",
      href: "#",
      icon: <FileText className="w-4 h-4" />,
    },
  ]

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="relative px-6 pt-8 pb-6">
          {/* Profile Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-semibold ring-4 ring-white dark:ring-zinc-900">
                U
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                User
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Not logged in
              </p>
            </div>
          </div>

          <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-6" />

          {/* Menu Items */}
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors duration-200"
              >
                {item.icon}
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {item.label}
                </span>
              </Link>
            ))}

            <button
              type="button"
              className="w-full flex items-center gap-2 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors duration-200 text-red-600 dark:text-red-400"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
