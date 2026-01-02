import RecurringPaymentsManagement from "@/components/recurring-payments-management"

export const metadata = {
  title: "Recurring Payments | Finora",
  description: "Manage your recurring bills and subscriptions"
}

export default function RecurringPaymentsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Recurring Payments</h1>
        <p className="text-muted-foreground mt-2">
          Track and manage your recurring bills, subscriptions, and regular payments
        </p>
      </div>
      <RecurringPaymentsManagement />
    </div>
  )
}
