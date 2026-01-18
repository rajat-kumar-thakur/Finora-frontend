import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { CursorSpotlight } from "@/components/cursor-spotlight"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Finora - Smart Finance Tracker",
  description: "Modern finance management platform for tracking accounts, transactions, and financial insights",
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <CursorSpotlight />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
