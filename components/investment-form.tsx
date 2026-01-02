"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { investmentApi, type Investment, type InvestmentCreate } from '@/lib/api/investments'

interface InvestmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  investment?: Investment
}

export function InvestmentForm({ open, onOpenChange, onSuccess, investment }: InvestmentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<InvestmentCreate>({
    symbol: '',
    name: '',
    quantity: 0,
    purchase_price: 0,
    current_price: 0,
    investment_type: 'Stock',
    purchase_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (investment) {
      setFormData({
        symbol: investment.symbol,
        name: investment.name,
        quantity: investment.quantity,
        purchase_price: investment.purchase_price,
        current_price: investment.current_price,
        investment_type: investment.investment_type,
        purchase_date: investment.purchase_date.split('T')[0]
      })
    } else {
      setFormData({
        symbol: '',
        name: '',
        quantity: 0,
        purchase_price: 0,
        current_price: 0,
        investment_type: 'Stock',
        purchase_date: new Date().toISOString().split('T')[0]
      })
    }
    setError(null)
  }, [investment, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    console.log('Submitting investment data:', formData)
    
    try {
      if (investment) {
        await investmentApi.update(investment.id, formData)
      } else {
        const result = await investmentApi.create(formData)
        console.log('Investment created:', result)
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: unknown) {
      console.error('Failed to save investment:', error)
      const errorMessage = (error as { data?: { detail?: string }; message?: string })?.data?.detail || (error as { message?: string })?.message || 'Failed to save investment'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const isMutualFund = formData.investment_type === 'Mutual Fund'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{investment ? 'Edit Investment' : 'Add Investment'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.investment_type}
              onValueChange={(value) => setFormData({ ...formData, investment_type: value as 'Stock' | 'Mutual Fund' | 'ETF' | 'Crypto' | 'Bond' | 'Other' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Stock">Stock</SelectItem>
                <SelectItem value="Mutual Fund">Mutual Fund</SelectItem>
                <SelectItem value="ETF">ETF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">{isMutualFund ? 'Fund Code' : 'Symbol'}</Label>
            <Input
              id="symbol"
              placeholder={isMutualFund ? 'e.g., SBI Gold Direct Plan' : 'e.g., AAPL'}
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">{isMutualFund ? 'Fund Name' : 'Company Name'}</Label>
            <Input
              id="name"
              placeholder={isMutualFund ? 'Full fund name' : 'e.g., Apple Inc.'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">{isMutualFund ? 'Units' : 'Quantity'}</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                placeholder={isMutualFund ? 'e.g., 190.273' : 'e.g., 100'}
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_price">{isMutualFund ? 'Avg. NAV' : 'Avg. Price'}</Label>
              <Input
                id="purchase_price"
                type="number"
                step="any"
                placeholder={isMutualFund ? 'e.g., 39.42' : 'e.g., 150.00'}
                value={formData.purchase_price || ''}
                onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_price">{isMutualFund ? 'Current NAV' : 'Current Price'}</Label>
              <Input
                id="current_price"
                type="number"
                step="any"
                placeholder={isMutualFund ? 'e.g., 40.81' : 'e.g., 175.00'}
                value={formData.current_price || ''}
                onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                required
              />
            </div>
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
