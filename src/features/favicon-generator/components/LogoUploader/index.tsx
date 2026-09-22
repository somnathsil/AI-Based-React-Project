import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/common/Button'
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE_BYTES } from '../../utils/imageValidation'
import './styles.scss'

interface LogoUploaderProps {
  objectUrl: string | null
  file: File | null
  imageInfo: { width: number; height: number; hasTransparency: boolean } | null
  disabled?: boolean
  onFileSelected: (file: File) => void
  onClear: () => void
  onOpenCropper: () => void
}

const ACCEPT = '.png,.jpg,.jpeg,image/png,image/jpeg'

export function LogoUploader({
  objectUrl,
  file,
  imageInfo,
  disabled = false,
  onFileSelected,
  onClear,
  onOpenCropper,
}: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (file) onFileSelected(file)
    },
    [onFileSelected],
  )

  return (
    <section className="fg-card fg-uploader">
      <h2 className="fg-card__title">1. Upload your logo</h2>
      <p className="fg-card__subtitle">PNG or JPG · up to {Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB · you'll pick the crop area next</p>

      <div
        className={`fg-uploader__dropzone ${dragActive ? 'fg-uploader__dropzone--active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          if (!disabled) handleFiles(e.dataTransfer.files)
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled) inputRef.current?.click()
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="fg-uploader__input"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />

        {objectUrl && file ? (
          <div className="fg-uploader__preview">
            <div className={`fg-uploader__thumb ${imageInfo?.hasTransparency ? 'fg-uploader__thumb--checker' : ''}`}>
              <img src={objectUrl} alt={`${file.name} preview`} />
            </div>
            <div className="fg-uploader__meta">
              <span className="fg-uploader__name" title={file.name}>
                {file.name}
              </span>
              <span className="fg-uploader__dims">
                {imageInfo ? `${imageInfo.width} × ${imageInfo.height} px` : ''}
                {imageInfo?.hasTransparency ? ' · transparent' : ''}
              </span>
            </div>
            <button
              type="button"
              className="fg-uploader__clear"
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
              aria-label="Remove selected logo"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="fg-uploader__placeholder">
            <div className="fg-uploader__icon" aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <p className="fg-uploader__text">Drag & drop your logo here, or click to browse</p>
            <p className="fg-uploader__hint">Only .png, .jpg and .jpeg files are accepted</p>
          </div>
        )}
      </div>

      <div className="fg-uploader__actions">
        <Button variant="ghost" size="sm" onClick={onOpenCropper} disabled={disabled || !objectUrl}>
          Crop area
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={disabled || (!file && !objectUrl)}>
          Clear
        </Button>
      </div>
    </section>
  )
}
