/**
 * Fixed Deposits Page
 *
 * Track fixed deposits and recurring deposits with PNB interest rates.
 */

'use client'

import { useState } from 'react'
import { FixedDepositList } from '@/components/fixed-deposit-list'

export default function FixedDepositsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUpdate = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Fixed Deposits</h1>
        <p className="page-subtitle">Track your fixed and recurring deposits</p>
      </div>

      {/* Deposit List */}
      <FixedDepositList onUpdate={handleUpdate} refreshTrigger={refreshTrigger} />
    </div>
  )
}
