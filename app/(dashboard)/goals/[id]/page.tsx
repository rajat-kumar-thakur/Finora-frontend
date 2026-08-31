'use client'

import { use } from 'react'

import { GoalDetailView } from '@/components/goal-detail-view'

export default function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <div className="page-container">
      <GoalDetailView goalId={id} />
    </div>
  )
}
