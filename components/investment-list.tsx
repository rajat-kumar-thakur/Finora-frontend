"use client"

import { useState, useEffect } from 'react'
import { investmentApi, type Investment } from '@/lib/api/investments'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react'
import { InvestmentForm } from './investment-form'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatCurrency } from '@/lib/utils'

interface InvestmentListProps {
  onUpdate: () => void
}

export function InvestmentList({ onUpdate }: InvestmentListProps) {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<Investment | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<'stocks' | 'mutualfunds'>('stocks')
  const [confirmTarget, setConfirmTarget] = useState<Investment | null>(null)

  const fetchInvestments = async () => {
    try {
      const data = await investmentApi.getAll()
      setInvestments(data || [])
    } catch {
      setInvestments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvestments()
  }, [])

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await investmentApi.delete(id)
      fetchInvestments()
      onUpdate()
    } catch {
      // Silently fail - UI will remain unchanged
    }
  }

  const handleSuccess = () => {
    fetchInvestments()
    onUpdate()
  }

  const handleAdd = () => {
    setEditingInvestment(undefined)
    setIsFormOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-9 w-full" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const stocks = (investments || []).filter(inv => inv.investment_type === 'Stock' || inv.investment_type === 'ETF')
  const mutualFunds = (investments || []).filter(inv => inv.investment_type === 'Mutual Fund')

  const renderInvestmentTable = (investmentList: Investment[], emptyMessage: string, isMutualFund: boolean = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{isMutualFund ? 'Fund' : 'Symbol'}</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">{isMutualFund ? 'Units' : 'Qty'}</TableHead>
          <TableHead className="text-right">{isMutualFund ? 'Avg NAV' : 'Avg Price'}</TableHead>
          <TableHead className="text-right">{isMutualFund ? 'Cur NAV' : 'Cur Price'}</TableHead>
          <TableHead className="text-right">{isMutualFund ? 'Invested' : 'Value'}</TableHead>
          <TableHead className="text-right">Return</TableHead>
          <TableHead className="w-[100px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {investmentList.map((inv) => {
          const value = inv.quantity * inv.current_price
          const cost = inv.quantity * inv.purchase_price
          const ret = value - cost
          const retPercent = cost > 0 ? (ret / cost) * 100 : 0
          
          return (
            <TableRow key={inv.id}>
              <TableCell className="font-medium">{inv.symbol}</TableCell>
              <TableCell>{inv.name}</TableCell>
              <TableCell className="text-right font-numeric">{inv.quantity}</TableCell>
              <TableCell className="text-right font-numeric">{formatCurrency(inv.purchase_price)}</TableCell>
              <TableCell className="text-right font-numeric">{formatCurrency(inv.current_price)}</TableCell>
              <TableCell className="text-right font-bold font-numeric">{formatCurrency(value)}</TableCell>
              <TableCell className={`text-right font-numeric ${ret >= 0 ? 'text-positive' : 'text-negative'}`}>
                {formatCurrency(ret)} ({retPercent.toFixed(2)}%)
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" aria-label="Edit investment" onClick={() => handleEdit(inv)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Delete investment" onClick={() => setConfirmTarget(inv)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
        {investmentList.length === 0 && (
          <TableRow>
            <TableCell colSpan={8}>
              <EmptyState icon={TrendingUp} title={emptyMessage} />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Holdings</CardTitle>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Investment
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'stocks' | 'mutualfunds')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stocks">
              Stocks ({stocks.length})
            </TabsTrigger>
            <TabsTrigger value="mutualfunds">
              Mutual Funds ({mutualFunds.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="stocks" className="mt-4">
            {renderInvestmentTable(stocks, 'No stocks found. Add your first stock to start tracking.', false)}
          </TabsContent>
          <TabsContent value="mutualfunds" className="mt-4">
            {renderInvestmentTable(mutualFunds, 'No mutual funds found. Add your first mutual fund to start tracking.', true)}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <InvestmentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleSuccess}
        investment={editingInvestment}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(o) => { if (!o) setConfirmTarget(null) }}
        title="Delete investment?"
        description="This will permanently remove this investment from your portfolio."
        onConfirm={() => { if (confirmTarget) handleDelete(confirmTarget.id) }}
      />
    </Card>
  )
}
