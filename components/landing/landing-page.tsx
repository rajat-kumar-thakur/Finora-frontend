"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  TrendingUp,
  PieChart,
  Upload,
  Shield,
  Zap,
  BarChart3,
  ArrowRight,
  Target,
  Bell,
  FileText,
  Landmark
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

// Implemented features (Phase 0, 1A, 1B - Complete)
const features = [
  {
    icon: Upload,
    title: "PDF Statement Import",
    description: "Upload bank statements and let AI extract transactions automatically."
  },
  {
    icon: PieChart,
    title: "Smart Categorization",
    description: "Auto-categorize transactions with customizable categories."
  },
  {
    icon: TrendingUp,
    title: "Net Worth Tracking",
    description: "Track your net worth across all bank accounts."
  },
  {
    icon: BarChart3,
    title: "Financial Insights",
    description: "Monthly summaries and category-wise breakdowns."
  },
  {
    icon: FileText,
    title: "Export Reports",
    description: "Export to PDF, Excel, or CSV formats."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Encrypted data with JWT authentication."
  }
]

// Upcoming features (Phase 2-5)
const upcomingFeatures = [
  { icon: Target, text: "Budgets & Alerts" },
  { icon: Landmark, text: "Investment Tracking" },
  { icon: Zap, text: "AI Financial Assistant" },
  { icon: Bell, text: "Auto Bank Sync" }
]

export function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/icon.png" alt="Finora" width={36} height={36} className="rounded-lg" />
              <span className="text-xl font-bold">Finora</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - pt-16 accounts for fixed header, min-h-[calc(100vh-4rem)] ensures content below is visible */}
      <section className="relative overflow-hidden h-[calc(100vh-4rem)] flex items-center justify-center mt-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Take Control of Your
              <span className="block text-primary">Financial Future</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Finora helps you track expenses, manage transactions, and gain insights into your spending habits.
              Upload bank statements and let AI do the heavy lifting.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-2 text-base">
                  Start for Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-base">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="min-h-screen flex flex-col justify-center py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl not-italic">
              Your Financial Dashboard
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Everything you need to manage your finances in one beautiful interface
            </p>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="relative mx-auto max-w-7xl">
            <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
              {/* Mock Header */}
              <div className="border-b bg-muted/30 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="text-sm text-muted-foreground">Dashboard Overview</div>
                </div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="p-6 sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Net Worth Card */}
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-muted-foreground">Net Worth</div>
                      <div className="mt-2 text-3xl font-bold">$47,250.00</div>
                      <div className="mt-2 flex items-center text-sm text-green-600 dark:text-green-400">
                        <TrendingUp className="mr-1 h-4 w-4" />
                        +12.5% this month
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Income */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-muted-foreground">Monthly Income</div>
                      <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">+$5,200</div>
                      <div className="mt-2 text-sm text-muted-foreground">From 3 sources</div>
                    </CardContent>
                  </Card>

                  {/* Monthly Expenses */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-muted-foreground">Monthly Expenses</div>
                      <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">-$3,450</div>
                      <div className="mt-2 text-sm text-muted-foreground">Across 8 categories</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Mock Chart Area */}
                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  <Card>
                    <CardContent className="p-6">
                      <div className="mb-4 text-lg font-semibold">Spending by Category</div>
                      <div className="space-y-3">
                        {[
                          { name: "Housing", amount: "$1,200", percent: 35, color: "bg-blue-500" },
                          { name: "Food & Dining", amount: "$650", percent: 19, color: "bg-green-500" },
                          { name: "Transportation", amount: "$450", percent: 13, color: "bg-yellow-500" },
                          { name: "Shopping", amount: "$380", percent: 11, color: "bg-purple-500" }
                        ].map((item) => (
                          <div key={item.name} className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${item.color}`} />
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span>{item.name}</span>
                                <span className="text-muted-foreground">{item.amount}</span>
                              </div>
                              <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                                <div
                                  className={`h-2 rounded-full ${item.color}`}
                                  style={{ width: `${item.percent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="mb-4 text-lg font-semibold">Recent Transactions</div>
                      <div className="space-y-4">
                        {[
                          { name: "Grocery Store", category: "Food & Dining", amount: "-$85.50", date: "Today" },
                          { name: "Salary Deposit", category: "Income", amount: "+$3,200.00", date: "Jan 15" },
                          { name: "Electric Bill", category: "Utilities", amount: "-$124.00", date: "Jan 14" }
                        ].map((tx, i) => (
                          <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                            <div>
                              <div className="font-medium">{tx.name}</div>
                              <div className="text-sm text-muted-foreground">{tx.category} • {tx.date}</div>
                            </div>
                            <div className={tx.amount.startsWith("+") ? "text-lg font-semibold text-green-600 dark:text-green-400" : "text-lg font-semibold"}>
                              {tx.amount}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              What You Can Do Today
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Features already available in Finora
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="relative overflow-hidden transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Get Started in Minutes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to financial clarity
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Create Your Account",
                description: "Sign up for free and set up your profile in seconds."
              },
              {
                step: "2",
                title: "Upload Statements",
                description: "Upload your bank PDF statements and let AI extract transactions."
              },
              {
                step: "3",
                title: "Track & Analyze",
                description: "View insights, track spending, and export reports."
              }
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-20 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Coming Soon
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Exciting features on our roadmap
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {upcomingFeatures.map((feature) => (
              <div
                key={feature.text}
                className="flex items-center gap-2 rounded-full border bg-background px-4 py-2"
              >
                <feature.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-20 text-center sm:px-16">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Take Control?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Join Finora today and start your journey to financial clarity. It&apos;s free to get started.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 text-base">
                    Create Free Account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/icon.png" alt="Finora" width={28} height={28} className="rounded-lg" />
              <span className="font-semibold">Finora</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Finora. Personal finance tracking made simple.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
