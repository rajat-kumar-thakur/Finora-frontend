"use client"

/**
 * Category Management Component
 * 
 * View, create, edit, and delete categories.
 */

import { useState, useEffect } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { categoryApi, type Category, type CategoryCreate } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState<CategoryCreate>({
    name: '',
    color: '#6B7280',
    icon: '',
  })
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<Category | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await categoryApi.list()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newCategory.name.trim()) {
      setError('Category name is required')
      return
    }

    setCreating(true)
    setError(null)

    try {
      await categoryApi.create(newCategory)
      setNewCategory({ name: '', color: '#6B7280', icon: '' })
      setShowCreateForm(false)
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    setDeleting(categoryId)
    setError(null)

    try {
      await categoryApi.delete(categoryId)
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category')
    } finally {
      setDeleting(null)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setEditForm({ ...category })
    setShowCreateForm(false)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const handleUpdate = async (categoryId: string) => {
    if (!editForm || !editForm.name.trim()) {
      setError('Category name is required')
      return
    }

    setUpdating(true)
    setError(null)

    try {
      await categoryApi.update(categoryId, {
        name: editForm.name,
        color: editForm.color,
        icon: editForm.icon || undefined,
      })
      setEditingId(null)
      setEditForm(null)
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  const systemCategories = categories.filter(c => c.type === 'system')
  const userCategories = categories.filter(c => c.type === 'user')

  return (
    <div className="space-y-6">
      {/* Create Category Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Categories</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          {showCreateForm ? 'Cancel' : '+ Create Category'}
        </button>
      </div>

      {error && (
        <div className="alert-error">{error}</div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="card-base card-padding space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="input-sm"
              placeholder="e.g., Groceries"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Color
              </label>
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-background p-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Icon (emoji)
              </label>
              <input
                type="text"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                className="input-sm"
                placeholder="🛒"
                maxLength={2}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="btn-primary w-full"
          >
            {creating ? 'Creating...' : 'Create Category'}
          </button>
        </form>
      )}

      {/* System Categories */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">System Categories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {systemCategories.map((category) => (
            <div key={category.id}>
              {/* System categories are read-only */}
              <div className="flex items-center justify-between gap-2 p-3 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    {category.icon || '📌'}
                  </div>
                  <span className="text-sm font-medium text-card-foreground truncate">
                    {category.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">System</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Categories */}
      {userCategories.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Custom Categories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {userCategories.map((category) => (
              <div key={category.id}>
                {editingId === category.id && editForm ? (
                  // Edit Mode
                  <div className="p-3 bg-primary/5 border-2 border-primary/20 rounded-lg space-y-2">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground"
                      placeholder="Category name"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-full h-8 border border-border rounded"
                      />
                      <select
                        value={editForm.icon || ''}
                        onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                        className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground"
                      >
                        <option value="">Select icon</option>
                        <option value="🍽️">🍽️ Food</option>
                        <option value="🚗">🚗 Transport</option>
                        <option value="🏠">🏠 Home</option>
                        <option value="⚡">⚡ Utilities</option>
                        <option value="🏥">🏥 Health</option>
                        <option value="🎬">🎬 Entertainment</option>
                        <option value="🛍️">🛍️ Shopping</option>
                        <option value="📚">📚 Education</option>
                        <option value="🛡️">🛡️ Insurance</option>
                        <option value="💰">💰 Salary</option>
                        <option value="📈">📈 Investment</option>
                        <option value="↔️">↔️ Transfer</option>
                        <option value="📌">📌 Other</option>
                        <option value="🎮">🎮 Gaming</option>
                        <option value="✈️">✈️ Travel</option>
                        <option value="💳">💳 Bills</option>
                        <option value="🎁">🎁 Gifts</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(category.id)}
                        disabled={updating}
                        className="flex-1 px-2 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 disabled:opacity-50"
                      >
                        {updating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={updating}
                        className="flex-1 px-2 py-1 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/80"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between gap-2 p-3 bg-card border border-border rounded-lg hover:border-destructive/50 transition-colors group">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: category.color + '20' }}
                      >
                        {category.icon || '📌'}
                      </div>
                      <span className="text-sm font-medium text-card-foreground truncate">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(category)}
                        className="flex-shrink-0 p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit category"
                        aria-label="Edit category"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setConfirmTarget(category)}
                        disabled={deleting === category.id}
                        className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Delete category"
                        aria-label="Delete category"
                      >
                        {deleting === category.id ? (
                          <span className="spinner-sm h-4 w-4 text-destructive" />
                        ) : (
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(o) => { if (!o) setConfirmTarget(null) }}
        title="Delete category?"
        description={
          confirmTarget
            ? `Delete the "${confirmTarget.name}" category? This cannot be undone.`
            : undefined
        }
        onConfirm={() => { if (confirmTarget) handleDelete(confirmTarget.id) }}
      />
    </div>
  )
}
