"use client"

/**
 * Net Worth Component
 * 
 * Displays simplified net worth (bank balance only for Phase 1B).
 */

import { useState, useEffect } from 'react'
import { summaryApi, type NetWorth } from '@/lib/api'
import { investmentApi, type PortfolioSummary } from '@/lib/api/investments'
import { fixedDepositApi, type FixedDepositSummary } from '@/lib/api/fixed-deposits'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface NetWorthCardProps {
  refreshTrigger?: number
}

export function NetWorthCard({ refreshTrigger }: NetWorthCardProps = {}) {
  const [netWorth, setNetWorth] = useState<NetWorth | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
  const [fdSummary, setFdSummary] = useState<FixedDepositSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadNetWorth()
    loadPortfolio()
    loadFdSummary()
  }, [refreshTrigger])

  const loadNetWorth = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await summaryApi.netWorth()
      setNetWorth(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balance')
    } finally {
      setLoading(false)
    }
  }

  const loadPortfolio = async () => {
    try {
      const data = await investmentApi.getSummary()
      setPortfolio(data)
    } catch {
      // Silently fail - portfolio will show as null
    }
  }

  const loadFdSummary = async () => {
    try {
      const data = await fixedDepositApi.getSummary()
      setFdSummary(data)
    } catch {
      // Silently fail
    }
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <h2 className="text-sm sm:text-base font-semibold text-foreground">Accounts</h2>
      </div>

      {/* Total Balance */}
      <div className="mb-3 sm:mb-4">
        <div className="text-xs text-muted-foreground mb-1">Total Balance</div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          {formatCurrency((netWorth?.bank_balance || 0) + (portfolio?.total_value || 0) + (fdSummary?.total_invested || 0))}
        </div>
        <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
          Bank: {formatCurrency(netWorth?.bank_balance || 0)} + Investments: {formatCurrency(portfolio?.total_value || 0)}{(fdSummary?.total_invested || 0) > 0 ? ` + FD: ${formatCurrency(fdSummary?.total_invested || 0)}` : ''}
        </div>
      </div>

      {/* Account Details */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground mb-2">Your Accounts</div>
        
        {/* Main Account */}
        <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border hover:bg-accent transition-all duration-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Main Account</div>
              <div className="text-xs text-muted-foreground">Current balance</div>
            </div>
          </div>
          <div className="text-sm font-semibold text-foreground">
            {formatCurrency(netWorth?.bank_balance || 0)}
          </div>
        </div>

        {/* Investments - Coming Soon */}
        <Link href="/investments" className="block">
          <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
            portfolio && portfolio.total_value > 0
              ? 'bg-accent/50 border-border hover:bg-accent'
              : 'bg-accent/30 border-dashed border-border opacity-60'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Investment Portfolio</div>
                <div className="text-xs text-muted-foreground">
                  {portfolio && portfolio.total_value > 0 ? (
                    <span className={portfolio.total_return >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {portfolio.total_return >= 0 ? '+' : ''}{portfolio.return_percentage.toFixed(2)}% return
                    </span>
                  ) : (
                    'No investments yet'
                  )}
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {portfolio && portfolio.total_value > 0 
                ? formatCurrency(portfolio.total_value)
                : '—'
              }
            </div>
          </div>
        </Link>

        {/* Fixed Deposits */}
        <Link href="/fixed-deposits" className="block">
          <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
            fdSummary && fdSummary.total_invested > 0
              ? 'bg-accent/50 border-border hover:bg-accent'
              : 'bg-accent/30 border-dashed border-border opacity-60'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Fixed Deposits</div>
                <div className="text-xs text-muted-foreground">
                  {fdSummary && fdSummary.total_invested > 0
                    ? 'Amount invested'
                    : 'No deposits yet'
                  }
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {fdSummary && fdSummary.total_invested > 0
                ? formatCurrency(fdSummary.total_invested)
                : '—'
              }
            </div>
          </div>
        </Link>
      </div>

      {/* Footer Note */}
      <div className="mt-3 text-xs text-muted-foreground">
        Last updated: {netWorth ? new Date(netWorth.calculated_at).toLocaleString('en-IN') : ''}
      </div>
    </div>
  )
}
