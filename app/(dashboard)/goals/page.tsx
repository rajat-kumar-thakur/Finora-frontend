'use client'

import { GoalList } from '@/components/goal-list'

export default function GoalsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Goals</h1>
        <p className="page-subtitle">
          Track what your existing money is set aside for
        </p>
      </div>
      <GoalList />
    </div>
  )
}
