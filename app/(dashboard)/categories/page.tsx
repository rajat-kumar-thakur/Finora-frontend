/**
 * Categories Page
 * 
 * Manage transaction categories.
 */

'use client'

import { CategoryManagement } from '@/components/category-management'

export default function CategoriesPage() {
  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">
          Categories
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage system and custom categories for transaction classification
        </p>
      </div>

      {/* Category Management */}
      <CategoryManagement />
    </div>
  )
}
