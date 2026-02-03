"use client"

import { useState } from "react"
import {
  Search,
  Upload,
  ArrowLeftRight,
  FolderKanban,
  Download,
  BarChart3,
  Target,
  TrendingUp,
  Shield,
  Zap,
  BookOpen,
  MessageCircle,
  Mail,
  ExternalLink,
  Keyboard,
  Lightbulb,
  FileText,
  CreditCard,
  PieChart,
  Clock,
} from "lucide-react"
import { Accordion, AccordionItem } from "@/components/ui/accordion"

const features = [
  {
    icon: Upload,
    title: "PDF Upload",
    description: "Upload your bank statements in PDF format and let AI automatically extract and categorize transactions.",
    link: "/upload",
  },
  {
    icon: ArrowLeftRight,
    title: "Transactions",
    description: "View, filter, edit, and manage all your transactions in one place with powerful search and filtering.",
    link: "/transactions",
  },
  {
    icon: FolderKanban,
    title: "Categories",
    description: "Organize spending with custom categories. Create, edit, and assign colors and icons to track expenses.",
    link: "/categories",
  },
  {
    icon: Download,
    title: "Export Data",
    description: "Export your financial data to PDF, Excel, or CSV formats with customizable date ranges and filters.",
    link: "/transactions",
  },
  {
    icon: BarChart3,
    title: "Insights",
    description: "Get detailed analytics on your spending patterns, income trends, and category breakdowns.",
    link: "/insights",
  },
  {
    icon: Target,
    title: "Budgets",
    description: "Set monthly budgets for different categories and track your progress throughout the month.",
    link: "/budgets",
  },
  {
    icon: TrendingUp,
    title: "Investments",
    description: "Track your investment portfolio and monitor asset allocation and performance.",
    link: "/investments",
  },
  {
    icon: Clock,
    title: "Recurring Bills",
    description: "Track recurring payments and subscriptions to never miss a payment deadline.",
    link: "/recurring-payments",
  },
]

const quickStartSteps = [
  {
    step: 1,
    title: "Upload Your Bank Statement",
    description: "Go to the Upload page and drag & drop your bank statement PDF. Our AI will automatically extract all transactions.",
    icon: FileText,
  },
  {
    step: 2,
    title: "Review & Categorize",
    description: "Check the extracted transactions and adjust categories as needed. The system learns from your choices.",
    icon: FolderKanban,
  },
  {
    step: 3,
    title: "Set Up Budgets",
    description: "Create monthly budgets for different spending categories to keep your finances on track.",
    icon: Target,
  },
  {
    step: 4,
    title: "Track & Analyze",
    description: "Use the dashboard and insights to monitor your spending patterns and financial health.",
    icon: PieChart,
  },
]

const faqs = [
  {
    question: "How do I upload a bank statement?",
    answer: "Navigate to the Upload page from the sidebar. You can drag and drop your PDF file or click to browse. Our AI will automatically extract transactions from most major bank statement formats. The process typically takes a few seconds.",
  },
  {
    question: "What bank statement formats are supported?",
    answer: "Finora uses AI to extract transactions from PDF bank statements. Most standard bank statement formats are supported, including statements from major banks. If you encounter issues with a specific format, try uploading a clearer scan or contact support.",
  },
  {
    question: "How does automatic categorization work?",
    answer: "When you upload a statement, our AI analyzes transaction descriptions and assigns categories based on merchant names and transaction patterns. You can always manually adjust categories, and the system will improve over time based on your corrections.",
  },
  {
    question: "Can I create custom categories?",
    answer: "Yes! Go to the Categories page to create custom categories with custom names, colors, and emoji icons. System categories cannot be deleted, but you can create unlimited custom categories to match your tracking needs.",
  },
  {
    question: "How do I add a transaction manually?",
    answer: "On the Transactions page, click the '+ Add Transaction' button to open the creation form. Fill in the date, description, amount, type (credit/debit), and category. The balance will be calculated automatically based on your most recent transaction.",
  },
  {
    question: "How is my balance calculated?",
    answer: "Your balance is calculated from your most recent transaction. When you add new transactions, the system automatically calculates the running balance. For the most accurate tracking, ensure your PDF uploads include the ending balance.",
  },
  {
    question: "Can I export my financial data?",
    answer: "Yes! On the Transactions page, use the Export button to download your data in PDF, Excel, or CSV format. You can filter by date range, category, or transaction type before exporting to get exactly the data you need.",
  },
  {
    question: "What is the Finance Score?",
    answer: "The Finance Score is a measure of your overall financial health based on factors like spending consistency, savings rate, budget adherence, and more. It helps you understand where you stand and provides tips for improvement.",
  },
  {
    question: "Is my financial data secure?",
    answer: "Yes, security is our top priority. All data is encrypted in transit and at rest. Your bank statements are processed in memory and not stored permanently. We never have access to your bank login credentials.",
  },
  {
    question: "How do I delete my account?",
    answer: "Go to Settings and scroll to the Danger Zone section. You'll find the option to delete your account. This action is permanent and will remove all your data from our servers.",
  },
]

const keyboardShortcuts = [
  { keys: ["⌘", "K"], description: "Open quick search (coming soon)" },
  { keys: ["⌘", "N"], description: "Create new transaction (coming soon)" },
  { keys: ["⌘", "U"], description: "Upload statement (coming soon)" },
  { keys: ["Esc"], description: "Close modals and dialogs" },
  { keys: ["Tab"], description: "Navigate between form fields" },
  { keys: ["Enter"], description: "Submit forms and confirm actions" },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="page-container">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border mb-8">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative px-6 py-12 sm:px-12 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <BookOpen className="h-4 w-4" />
            Help Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How can we help you?
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Find answers to common questions, learn how to use Finora&apos;s features, and get the most out of your personal finance tracking.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Zap className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Quick Start Guide</h2>
            <p className="text-sm text-muted-foreground">Get up and running in minutes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStartSteps.map((item) => (
            <div
              key={item.step}
              className="relative p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="absolute top-4 right-4 text-4xl font-bold text-muted-foreground/20 group-hover:text-primary/20 transition-colors">
                {item.step}
              </div>
              <div className="p-2 rounded-lg bg-primary/10 w-fit mb-4">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Lightbulb className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Features Overview</h2>
            <p className="text-sm text-muted-foreground">Everything Finora has to offer</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <a
              key={feature.title}
              href={feature.link}
              className="p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-accent group-hover:bg-primary/10 transition-colors">
                  <feature.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    {feature.title}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {feature.description}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <MessageCircle className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? `${filteredFaqs.length} results found` : "Quick answers to common questions"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          {filteredFaqs.length > 0 ? (
            <Accordion>
              {filteredFaqs.map((faq, index) => (
                <AccordionItem key={index} title={faq.question}>
                  {faq.answer}
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No results found for &quot;{searchQuery}&quot;</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-2 text-primary hover:underline text-sm"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        {/* Keyboard Shortcuts */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Keyboard className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Keyboard Shortcuts</h2>
              <p className="text-sm text-muted-foreground">Work faster with shortcuts</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="space-y-3">
              {keyboardShortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                >
                  <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <kbd
                        key={keyIndex}
                        className="px-2 py-1 text-xs font-mono rounded bg-accent border border-border text-foreground"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security & Privacy */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Shield className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Security & Privacy</h2>
              <p className="text-sm text-muted-foreground">Your data is protected</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                <div>
                  <span className="font-medium text-foreground">End-to-end encryption</span>
                  <p className="text-sm text-muted-foreground">All data is encrypted in transit and at rest</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                <div>
                  <span className="font-medium text-foreground">No credential storage</span>
                  <p className="text-sm text-muted-foreground">We never store or access your bank login details</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                <div>
                  <span className="font-medium text-foreground">In-memory processing</span>
                  <p className="text-sm text-muted-foreground">PDF files are processed and immediately deleted</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                <div>
                  <span className="font-medium text-foreground">User-controlled data</span>
                  <p className="text-sm text-muted-foreground">Delete your account and all data anytime</p>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </div>

      {/* Contact Section */}
      <section className="mb-8">
        <div className="rounded-xl border border-border bg-gradient-to-br from-card to-accent/20 p-8 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Still need help?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help you with any questions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="mailto:work.rajatkt@gmail.com?subject=Finora%20Support%20Request&body=Hi%20Finora%20Support%2C%0A%0A---%20Please%20fill%20out%20the%20template%20below%20---%0A%0AIssue%20Type%3A%20%5BBug%20%2F%20Feature%20Request%20%2F%20Question%5D%0A%0ADescription%3A%0A%5BDescribe%20your%20issue%20or%20question%20in%20detail%5D%0A%0ASteps%20to%20Reproduce%20(if%20applicable)%3A%0A1.%20%0A2.%20%0A3.%20%0A%0AExpected%20Behavior%3A%0A%5BWhat%20did%20you%20expect%20to%20happen%3F%5D%0A%0AActual%20Behavior%3A%0A%5BWhat%20actually%20happened%3F%5D%0A%0ABrowser%2FDevice%3A%0A%5Be.g.%2C%20Chrome%20on%20Windows%5D%0A%0A---%20End%20of%20template%20---%0A%0AThank%20you!"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </a>
            <a
              href="https://github.com/rajat-kumar-thakur/Finora-frontend/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card text-foreground font-medium hover:bg-accent transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Report an Issue
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

      {/* Version Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Finora v0.1.0 • Made with ❤️ for better financial management</p>
      </div>
    </div>
  )
}
