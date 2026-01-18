/**
 * Categories Page
 * 
 * Manage transaction categories.
 */

'use client'

import { CategoryManagement } from '@/components/category-management'

export default function CategoriesPage() {
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Categories</h1>
        <p className="page-subtitle">Manage categories for transaction classification</p>
      </div>

      {/* Category Management */}
      <CategoryManagement />
    </div>
  )
}
