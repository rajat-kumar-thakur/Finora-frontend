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
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          Categories
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage categories for transaction classification
        </p>
      </div>

      {/* Category Management */}
      <CategoryManagement />
    </div>
  )
}
