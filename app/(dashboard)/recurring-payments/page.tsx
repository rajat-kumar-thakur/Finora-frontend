import RecurringPaymentsManagement from "@/components/recurring-payments-management"

export const metadata = {
  title: "Recurring Payments | Finora",
  description: "Manage your recurring bills and subscriptions"
}

export default function RecurringPaymentsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Recurring Payments</h1>
        <p className="page-subtitle">Track and manage your recurring bills, subscriptions, and regular payments</p>
      </div>
      <RecurringPaymentsManagement />
    </div>
  )
}
