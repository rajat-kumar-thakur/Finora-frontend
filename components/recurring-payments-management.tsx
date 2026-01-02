"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Check, Calendar, DollarSign, AlertCircle, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"

type PaymentFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly"

interface RecurringPayment {
  id: string
  category_id: string
  category_name?: string
  amount: number
  name: string
  frequency: PaymentFrequency
  start_date: string
  next_due_date: string
  reminder_days: number
  notes?: string
  is_active: boolean
  status: string
  days_until_due?: number
}

interface RecurringPaymentSummary {
  total_payments: number
  active_payments: number
  paused_payments: number
  monthly_total: number
  upcoming_7_days: number
  upcoming_30_days: number
  overdue: number
}

interface Category {
  id: string
  name: string
  color: string
}

const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly"
}

export default function RecurringPaymentsManagement() {
  const [payments, setPayments] = useState<RecurringPayment[]>([])
  const [summary, setSummary] = useState<RecurringPaymentSummary | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null)
  const [filter, setFilter] = useState<"all" | "upcoming" | "overdue">("all")
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    name: "",
    frequency: "monthly" as PaymentFrequency,
    start_date: "",
    next_due_date: "",
    reminder_days: "3",
    notes: ""
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [paymentsData, summaryData, categoriesData] = await Promise.all([
        filter === "upcoming" 
          ? apiClient.get<RecurringPayment[]>("/api/v1/recurring-payments/upcoming?days=7")
          : filter === "overdue"
          ? apiClient.get<RecurringPayment[]>("/api/v1/recurring-payments/overdue")
          : apiClient.get<RecurringPayment[]>("/api/v1/recurring-payments"),
        apiClient.get<RecurringPaymentSummary>("/api/v1/recurring-payments/summary"),
        apiClient.get<Category[]>("/api/v1/categories")
      ])
      
      setPayments(paymentsData || [])
      setSummary(summaryData || null)
      setCategories(categoriesData || [])
    } catch {
      toast({
        title: "Error",
        description: "Failed to load recurring payments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [filter, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        category_id: formData.category_id,
        amount: parseFloat(formData.amount),
        name: formData.name,
        frequency: formData.frequency,
        start_date: formData.start_date,
        next_due_date: formData.next_due_date,
        reminder_days: parseInt(formData.reminder_days),
        notes: formData.notes || undefined
      }

      if (editingPayment) {
        await apiClient.put(`/api/v1/recurring-payments/${editingPayment.id}`, payload)
        toast({ title: "Payment updated successfully" })
      } else {
        await apiClient.post("/api/v1/recurring-payments", payload)
        toast({ title: "Recurring payment created" })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch {
      toast({
        title: "Error",
        description: "Failed to save payment",
        variant: "destructive"
      })
    }
  }

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      await apiClient.post(`/api/v1/recurring-payments/${paymentId}/mark-paid`)
      toast({ title: "Payment marked as paid" })
      fetchData()
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark payment as paid",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this recurring payment?")) return
    
    try {
      await apiClient.delete(`/api/v1/recurring-payments/${paymentId}`)
      toast({ title: "Payment deleted" })
      fetchData()
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete payment",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (payment: RecurringPayment) => {
    setEditingPayment(payment)
    setFormData({
      category_id: payment.category_id,
      amount: payment.amount.toString(),
      name: payment.name,
      frequency: payment.frequency,
      start_date: payment.start_date.split("T")[0],
      next_due_date: payment.next_due_date.split("T")[0],
      reminder_days: payment.reminder_days.toString(),
      notes: payment.notes || ""
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingPayment(null)
    setFormData({
      category_id: "",
      amount: "",
      name: "",
      frequency: "monthly",
      start_date: "",
      next_due_date: "",
      reminder_days: "3",
      notes: ""
    })
  }

  const getDaysUntilDueColor = (days?: number) => {
    if (!days) return "default"
    if (days < 0) return "destructive"
    if (days <= 3) return "destructive"
    if (days <= 7) return "warning"
    return "default"
  }

  const getDaysUntilDueText = (days?: number) => {
    if (!days) return "Unknown"
    if (days < 0) return `${Math.abs(days)} days overdue`
    if (days === 0) return "Due today"
    if (days === 1) return "Due tomorrow"
    return `Due in ${days} days`
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Payments</CardDescription>
              <CardTitle className="text-3xl">{summary.active_payments}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Monthly Total</CardDescription>
              <CardTitle className="text-3xl">{formatCurrency(summary.monthly_total)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Upcoming (7 days)</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{summary.upcoming_7_days}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Overdue</CardDescription>
              <CardTitle className="text-3xl text-red-600">{summary.overdue}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "upcoming" ? "default" : "outline"}
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </Button>
          <Button
            variant={filter === "overdue" ? "default" : "outline"}
            onClick={() => setFilter("overdue")}
          >
            Overdue
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Recurring Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? "Edit Recurring Payment" : "Add Recurring Payment"}
              </DialogTitle>
              <DialogDescription>
                Set up a bill or subscription that repeats regularly
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories || []).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Netflix subscription, Rent, etc."
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: PaymentFrequency) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="next_due_date">Next Due Date</Label>
                <Input
                  id="next_due_date"
                  type="date"
                  value={formData.next_due_date}
                  onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="reminder_days">Reminder (days before)</Label>
                <Input
                  id="reminder_days"
                  type="number"
                  value={formData.reminder_days}
                  onChange={(e) => setFormData({ ...formData, reminder_days: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPayment ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : payments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No recurring payments found. Add your first one to get started!
            </CardContent>
          </Card>
        ) : (
          payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{payment.name}</h3>
                      <Badge variant="outline">{FREQUENCY_LABELS[payment.frequency]}</Badge>
                      {!payment.is_active && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(payment.amount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Next: {new Date(payment.next_due_date).toLocaleDateString()}
                      </span>
                      {payment.category_name && (
                        <Badge variant="outline">{payment.category_name}</Badge>
                      )}
                    </div>
                    <div className="mt-2">
                      <Badge variant={getDaysUntilDueColor(payment.days_until_due) as "default" | "secondary" | "destructive" | "outline"}>
                        {payment.days_until_due !== undefined && payment.days_until_due < 0 && (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {getDaysUntilDueText(payment.days_until_due)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(payment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleMarkAsPaid(payment.id)}
                      disabled={!payment.is_active}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark Paid
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(payment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
