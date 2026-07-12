"use client"

/**
 * Image Upload Component
 *
 * Handles bank statement image upload with clear feedback.
 */

import { useState } from 'react'
import { Image as ImageIcon, X, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { uploadApi, type UploadImageResponse } from '@/lib/api'
import { AccountSelector } from '@/components/account-selector'

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

interface ImageUploadProps {
  onUploadSuccess?: (result: UploadImageResponse) => void
}

export function ImageUpload({ onUploadSuccess }: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | undefined>(undefined)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadImageResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const ext = '.' + file.name.toLowerCase().split('.').pop()
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setError(`Please select an image file (${ALLOWED_EXTENSIONS.join(', ')})`)
        return
      }

      // 10MB limit
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }

      setSelectedFile(file)
      setError(null)
      setResult(null)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    if (!accountId) {
      setError('Please select a bank account before uploading')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const uploadResult = await uploadApi.uploadImage(selectedFile, accountId)
      setResult(uploadResult)

      if (onUploadSuccess) {
        onUploadSuccess(uploadResult)
      }

      // Reset file input and preview
      setSelectedFile(null)
      setPreview(null)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(null)
    setError(null)
    setResult(null)
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-8 bg-card">
        <div className="space-y-4">
          {/* Bank Account Selector */}
          <div className="max-w-sm mx-auto">
            <AccountSelector
              id="image-upload-account"
              label="Add transactions to which account?"
              value={accountId}
              onChange={setAccountId}
            />
          </div>

          <div className="text-center space-y-4">
          <div className="icon-box-lg mx-auto">
            <ImageIcon className="h-6 w-6" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Upload Bank Statement Image
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              JPG, PNG, or WEBP format, max 10MB
            </p>
          </div>

          {/* Preview */}
          {preview && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={clearSelection}
                aria-label="Remove image"
                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background/80 text-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <label
              htmlFor="image-upload"
              className="btn-outline cursor-pointer"
            >
              Choose Image
              <input
                id="image-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </label>

            {selectedFile && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || !accountId}
                className="btn-primary"
                title={!accountId ? 'Select a bank account first' : undefined}
              >
                {uploading ? 'Uploading...' : 'Upload & Extract'}
              </button>
            )}
          </div>

          {selectedFile && !preview && (
            <p className="text-sm text-foreground font-medium">
              Selected: {selectedFile.name}
            </p>
          )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-3 text-primary">
            <span className="spinner-sm" />
            <p className="text-sm text-foreground font-medium">
              Processing image and extracting transactions...
            </p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && !uploading && (
        <div className={`border rounded-lg p-4 ${
          result.error_count > 0 ? 'bg-warning/10 border-warning/20' : 'bg-positive/10 border-positive/20'
        }`}>
          <div className="space-y-3">
            <p className={`font-semibold text-base ${
              result.error_count > 0 ? 'text-warning' : 'text-positive'
            }`}>
              {result.message}
            </p>

            <div className="text-sm space-y-2">
              <p className="flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-positive" /> Successfully imported: <span className="font-semibold font-numeric">{result.success_count}</span> transactions
              </p>
              {result.duplicate_count > 0 && (
                <p className="flex items-center gap-1.5 text-primary">
                  <Info className="h-4 w-4" /> Duplicates skipped: <span className="font-semibold font-numeric">{result.duplicate_count}</span>
                </p>
              )}
              {result.error_count > 0 && (
                <p className="flex items-center gap-1.5 text-warning">
                  <TriangleAlert className="h-4 w-4" /> Errors: <span className="font-semibold font-numeric">{result.error_count}</span>
                </p>
              )}
            </div>

            {result.errors.length > 0 && (
              <details className="mt-3">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  View errors ({result.errors.length})
                </summary>
                <ul className="mt-2 text-xs text-muted-foreground space-y-1 pl-4">
                  {result.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx} className="list-disc">{err}</li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="text-muted-foreground/70">
                      ...and {result.errors.length - 10} more
                    </li>
                  )}
                </ul>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert-error">{error}</div>
      )}

      {/* Limitations Notice */}
      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Note:</strong> Image extraction is powered by AI and works best with clear, high-resolution screenshots.
          For best results, ensure the entire statement is visible and text is legible.
        </p>
      </div>
    </div>
  )
}
