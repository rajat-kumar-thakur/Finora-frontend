"use client"

import { useState, useEffect } from 'react'
import { fixedDepositApi, type FixedDeposit, type FixedDepositSummary } from '@/lib/api/fixed-deposits'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react'
import { FixedDepositForm } from './fixed-deposit-form'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatCurrency } from '@/lib/utils'

interface FixedDepositListProps {
  onUpdate: () => void
  refreshTrigger?: number
}

export function FixedDepositList({ onUpdate, refreshTrigger }: FixedDepositListProps) {
  const [deposits, setDeposits] = useState<FixedDeposit[]>([])
  const [summary, setSummary] = useState<FixedDepositSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDeposit, setEditingDeposit] = useState<FixedDeposit | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<'fd' | 'rd'>('fd')
  const [confirmTarget, setConfirmTarget] = useState<FixedDeposit | null>(null)

  const fetchDeposits = async () => {
    try {
      const [data, summaryData] = await Promise.all([
        fixedDepositApi.getAll(),
        fixedDepositApi.getSummary(),
      ])
      setDeposits(data || [])
      setSummary(summaryData)
    } catch {
      setDeposits([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeposits()
  }, [refreshTrigger])

  const handleEdit = (deposit: FixedDeposit) => {
    setEditingDeposit(deposit)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await fixedDepositApi.delete(id)
      fetchDeposits()
      onUpdate()
    } catch {
      // Silently fail
    }
  }

  const handleSuccess = () => {
    fetchDeposits()
    onUpdate()
  }

  const handleAdd = () => {
    setEditingDeposit(undefined)
    setIsFormOpen(true)
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default'
      case 'Matured': return 'secondary'
      case 'Withdrawn': return 'outline'
      default: return 'default'
    }
  }

  const formatTenure = (days: number) => {
    if (days >= 365) {
      const years = Math.floor(days / 365)
      const remainingDays = days % 365
      if (remainingDays === 0) return `${years}Y`
      return `${years}Y ${remainingDays}D`
    }
    return `${days}D`
  }

  if (loading) {
    return (
      <>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="stat-card">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-32 mt-3" />
            </div>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Deposits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-9 w-full" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  const fds = (deposits || []).filter(d => d.deposit_type === 'FD')
  const rds = (deposits || []).filter(d => d.deposit_type === 'RD')

  const renderDepositTable = (depositList: FixedDeposit[], isRD: boolean, emptyMessage: string) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bank</TableHead>
          <TableHead className="text-right">{isRD ? 'Monthly Amt' : 'Principal'}</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Tenure</TableHead>
          <TableHead>Start</TableHead>
          <TableHead>Maturity</TableHead>
          <TableHead className="text-right">Maturity Amt</TableHead>
          <TableHead className="text-right">Interest</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[100px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {depositList.map((dep) => {
          const totalInvested = isRD
            ? dep.principal_amount * Math.max(1, Math.round(dep.tenure_days / 30))
            : dep.principal_amount
          const interest = dep.maturity_amount - totalInvested

          return (
            <TableRow key={dep.id}>
              <TableCell className="font-medium">{dep.bank_name}</TableCell>
              <TableCell className="text-right font-numeric whitespace-nowrap">{formatCurrency(dep.principal_amount)}</TableCell>
              <TableCell className="text-right font-numeric whitespace-nowrap">{dep.interest_rate}%</TableCell>
              <TableCell className="text-right font-numeric whitespace-nowrap">{formatTenure(dep.tenure_days)}</TableCell>
              <TableCell className="font-numeric whitespace-nowrap">{new Date(dep.start_date).toLocaleDateString('en-IN')}</TableCell>
              <TableCell className="font-numeric whitespace-nowrap">{new Date(dep.maturity_date).toLocaleDateString('en-IN')}</TableCell>
              <TableCell className="text-right font-bold font-numeric whitespace-nowrap">{formatCurrency(dep.maturity_amount)}</TableCell>
              <TableCell className="text-right font-numeric whitespace-nowrap text-positive">
                {formatCurrency(interest)}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(dep.status) as 'default' | 'secondary' | 'outline'}>
                  {dep.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" aria-label="Edit deposit" onClick={() => handleEdit(dep)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Delete deposit" onClick={() => setConfirmTarget(dep)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
        {depositList.length === 0 && (
          <TableRow>
            <TableCell colSpan={10}>
              <EmptyState icon={PiggyBank} title={emptyMessage} />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )

  return (
    <>
      {/* Summary Cards */}
      {summary && (summary.total_invested > 0) && (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="stat-card">
            <div className="stat-label">Total Invested</div>
            <div className="stat-value font-numeric">{formatCurrency(summary.total_invested)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Maturity Value</div>
            <div className="stat-value font-numeric">{formatCurrency(summary.total_maturity_value)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Interest Earned</div>
            <div className="stat-value font-numeric text-positive">{formatCurrency(summary.total_interest_earned)}</div>
          </div>
        </div>
      )}

      {/* Deposit Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Deposits</CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Deposit
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'fd' | 'rd')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fd">
                Fixed Deposits ({fds.length})
              </TabsTrigger>
              <TabsTrigger value="rd">
                Recurring Deposits ({rds.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="fd" className="mt-4">
              {renderDepositTable(fds, false, 'No fixed deposits found. Add your first FD to start tracking.')}
            </TabsContent>
            <TabsContent value="rd" className="mt-4">
              {renderDepositTable(rds, true, 'No recurring deposits found. Add your first RD to start tracking.')}
            </TabsContent>
          </Tabs>
        </CardContent>

        <FixedDepositForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={handleSuccess}
          deposit={editingDeposit}
        />

        <ConfirmDialog
          open={!!confirmTarget}
          onOpenChange={(o) => { if (!o) setConfirmTarget(null) }}
          title="Delete deposit?"
          description="This will permanently remove this deposit from your records."
          onConfirm={() => { if (confirmTarget) handleDelete(confirmTarget.id) }}
        />
      </Card>
    </>
  )
}
