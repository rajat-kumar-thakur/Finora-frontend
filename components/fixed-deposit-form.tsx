"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fixedDepositApi, type FixedDeposit, type FixedDepositCreate } from '@/lib/api/fixed-deposits'
import { getApiErrorMessage } from '@/lib/utils'

interface FixedDepositFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  deposit?: FixedDeposit
}

const TENURE_PRESETS_FD = [
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
  { label: '390 Days', days: 390 },
  { label: '2 Years', days: 730 },
  { label: '3 Years', days: 1095 },
  { label: '5 Years', days: 1825 },
]

const TENURE_PRESETS_RD = [
  { label: '1 Year', days: 365 },
  { label: '400 Days', days: 400 },
  { label: '2 Years', days: 730 },
  { label: '3 Years', days: 1095 },
  { label: '5 Years', days: 1825 },
]

export function FixedDepositForm({ open, onOpenChange, onSuccess, deposit }: FixedDepositFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rate, setRate] = useState<number | null>(null)
  const [editStatus, setEditStatus] = useState<'Active' | 'Matured' | 'Withdrawn'>('Active')
  const [formData, setFormData] = useState<FixedDepositCreate>({
    deposit_type: 'FD',
    depositor_type: 'General',
    principal_amount: 0,
    tenure_days: 365,
    start_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (deposit) {
      setFormData({
        deposit_type: deposit.deposit_type,
        depositor_type: deposit.depositor_type,
        principal_amount: deposit.principal_amount,
        tenure_days: deposit.tenure_days,
        start_date: deposit.start_date.split('T')[0],
        notes: deposit.notes || undefined,
      })
      setRate(deposit.interest_rate)
      setEditStatus(deposit.status)
    } else {
      setFormData({
        deposit_type: 'FD',
        depositor_type: 'General',
        principal_amount: 0,
        tenure_days: 365,
        start_date: new Date().toISOString().split('T')[0],
      })
      setRate(null)
    }
    setError(null)
  }, [deposit, open])

  // Auto-lookup rate when parameters change (debounced)
  useEffect(() => {
    if (!formData.tenure_days || formData.tenure_days <= 0) return

    const timer = setTimeout(async () => {
      try {
        const result = await fixedDepositApi.lookupRate(
          formData.deposit_type,
          formData.depositor_type,
          formData.tenure_days
        )
        setRate(result.rate)
      } catch {
        setRate(null)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [formData.deposit_type, formData.depositor_type, formData.tenure_days])

  // Calculate maturity preview (FD only — simple quarterly compounding)
  const maturityPreview = (() => {
    if (!rate || !formData.principal_amount || formData.principal_amount <= 0) return null
    const r = rate / 100
    const t = formData.tenure_days / 365

    if (formData.deposit_type === 'FD') {
      const n = 4
      return formData.principal_amount * Math.pow(1 + r / n, n * t)
    } else {
      // RD: monthly installments with quarterly compounding
      const months = Math.max(1, Math.round(formData.tenure_days / 30))
      const n = 4
      const qr = r / n
      let total = 0
      for (let m = 0; m < months; m++) {
        const remainingYears = (months - m) / 12
        total += formData.principal_amount * Math.pow(1 + qr, n * remainingYears)
      }
      return total
    }
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (deposit) {
        await fixedDepositApi.update(deposit.id, {
          interest_rate: rate || undefined,
          status: editStatus,
          notes: formData.notes,
        })
      } else {
        await fixedDepositApi.create({
          ...formData,
          interest_rate: rate || undefined,
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Failed to save deposit'))
    } finally {
      setLoading(false)
    }
  }

  const tenurePresets = formData.deposit_type === 'FD' ? TENURE_PRESETS_FD : TENURE_PRESETS_RD

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{deposit ? 'Edit Deposit' : 'Add Deposit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deposit_type">Deposit Type</Label>
              <Select
                value={formData.deposit_type}
                onValueChange={(value) => setFormData({ ...formData, deposit_type: value as 'FD' | 'RD' })}
                disabled={!!deposit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FD">Fixed Deposit</SelectItem>
                  <SelectItem value="RD">Recurring Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="depositor_type">Depositor Type</Label>
              <Select
                value={formData.depositor_type}
                onValueChange={(value) => setFormData({ ...formData, depositor_type: value as 'General' | 'Senior Citizen' | 'Super Senior Citizen' })}
                disabled={!!deposit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select depositor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Senior Citizen">Senior Citizen</SelectItem>
                  <SelectItem value="Super Senior Citizen">Super Senior Citizen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="principal">
              {formData.deposit_type === 'FD' ? 'Principal Amount' : 'Monthly Installment'}
            </Label>
            <Input
              id="principal"
              type="number"
              step="any"
              placeholder="e.g., 100000"
              value={formData.principal_amount || ''}
              onChange={(e) => setFormData({ ...formData, principal_amount: parseFloat(e.target.value) || 0 })}
              required
              disabled={!!deposit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenure">Tenure (Days)</Label>
            <Input
              id="tenure"
              type="number"
              placeholder="e.g., 365"
              value={formData.tenure_days || ''}
              onChange={(e) => setFormData({ ...formData, tenure_days: parseInt(e.target.value) || 0 })}
              required
              disabled={!!deposit}
            />
            <div className="flex flex-wrap gap-1.5 mt-1">
              {tenurePresets.map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setFormData({ ...formData, tenure_days: preset.days })}
                  disabled={!!deposit}
                  className={`px-2 py-0.5 text-xs rounded-md border transition-colors ${
                    formData.tenure_days === preset.days
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:bg-accent text-muted-foreground'
                  } disabled:opacity-50`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date as string}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                disabled={!!deposit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interest_rate">Interest Rate (% p.a.)</Label>
              <Input
                id="interest_rate"
                type="number"
                step="0.01"
                placeholder="e.g., 6.60"
                value={rate ?? ''}
                onChange={(e) => setRate(parseFloat(e.target.value) || null)}
              />
            </div>
          </div>

          {maturityPreview && maturityPreview > 0 && (
            <div className="rounded-md border border-border bg-accent/20 px-4 py-3 space-y-1">
              <div className="text-xs text-muted-foreground">Estimated Maturity</div>
              <div className="text-lg font-bold text-foreground">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(maturityPreview)}
              </div>
              <div className="text-xs text-green-600">
                Interest: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
                  formData.deposit_type === 'FD'
                    ? maturityPreview - formData.principal_amount
                    : maturityPreview - formData.principal_amount * Math.max(1, Math.round(formData.tenure_days / 30))
                )}
              </div>
            </div>
          )}

          {deposit && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editStatus}
                onValueChange={(value) => setEditStatus(value as 'Active' | 'Matured' | 'Withdrawn')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Matured">Matured</SelectItem>
                  <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="e.g., For emergency fund"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value || undefined })}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
