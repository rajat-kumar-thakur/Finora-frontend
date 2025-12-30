"use client"

/**
 * Image Upload Component
 *
 * Handles bank statement image upload with clear feedback.
 */

import { useState } from 'react'
import { uploadApi, type UploadImageResponse } from '@/lib/api'

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

interface ImageUploadProps {
  onUploadSuccess?: (result: UploadImageResponse) => void
}

export function ImageUpload({ onUploadSuccess }: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
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

    setUploading(true)
    setError(null)

    try {
      const uploadResult = await uploadApi.uploadImage(selectedFile)
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
        <div className="text-center space-y-4">
          <div className="text-5xl">🖼️</div>

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
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={clearSelection}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full text-xs font-bold hover:bg-destructive/90 transition-colors"
              >
                X
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <label
              htmlFor="image-upload"
              className="cursor-pointer inline-flex items-center px-5 py-2.5 border border-border rounded-lg shadow-sm text-sm font-medium text-foreground bg-accent hover:bg-accent/80 transition-colors"
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
                disabled={uploading}
                className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-sm text-foreground font-medium">
              Processing image and extracting transactions...
            </p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && !uploading && (
        <div className={`border rounded-lg p-4 ${
          result.error_count > 0 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-green-500/10 border-green-500/20'
        }`}>
          <div className="space-y-3">
            <p className={`font-semibold text-base ${
              result.error_count > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
            }`}>
              {result.message}
            </p>

            <div className="text-sm space-y-2">
              <p className="text-foreground">
                Successfully imported: <span className="font-semibold">{result.success_count}</span> transactions
              </p>
              {result.duplicate_count > 0 && (
                <p className="text-primary">
                  Duplicates skipped: <span className="font-semibold">{result.duplicate_count}</span>
                </p>
              )}
              {result.error_count > 0 && (
                <p className="text-yellow-600 dark:text-yellow-400">
                  Errors: <span className="font-semibold">{result.error_count}</span>
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
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
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
