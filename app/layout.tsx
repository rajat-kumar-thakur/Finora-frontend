import type { Viewport } from "next"
import { Schibsted_Grotesk, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const fontSans = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-schibsted",
  display: "swap",
})

const fontMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains",
  display: "swap",
})

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#090e11" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
