import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/common/Button'
import type { CropRect } from '../../types/favicon.types'
import './styles.scss'

interface LogoCropperProps {
  objectUrl: string
  /** Called with the confirmed crop in NATURAL image pixels (square). */
  onConfirm: (rect: CropRect) => void
  /** Called when the user skips cropping (full image is used). */
  onCancel: () => void
}

type Corner = 'nw' | 'ne' | 'sw' | 'se'

/** Smallest allowed selection, in displayed pixels — kept ≥ 32 natural px in the hook. */
const MIN_DISPLAY_PX = 28

interface DragState {
  mode: 'move' | Corner
  pointerId: number
  startClientX: number
  startClientY: number
  orig: { x: number; y: number; size: number }
  /** display px per natural px at drag start */
  scale: number
  naturalWidth: number
  naturalHeight: number
}

/**
 * Square cropper for the favicon generator.
 * Drag inside the box to position it, drag a corner to resize.
 * Crop values are tracked in natural image pixels so the selection is
 * resolution-independent (window resizes never invalidate it).
 */
export function LogoCropper({ objectUrl, onConfirm, onCancel }: LogoCropperProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const [natural, setNatural] = useState({ width: 0, height: 0 })
  const [display, setDisplay] = useState({ width: 0, height: 0 })
  // Square selection in natural pixels.
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 0 })

  const scale = display.width > 0 && natural.width > 0 ? display.width / natural.width : 0

  // Track the displayed image box so the overlay always matches the <img>.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const measure = () => {
      const rect = frame.getBoundingClientRect()
      setDisplay({ width: rect.width, height: rect.height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    const w = img.naturalWidth
    const h = img.naturalHeight
    setNatural({ width: w, height: h })
    // Default to a centered 80% square — the user adjusts from here.
    const side = Math.floor(Math.min(w, h) * 0.8)
    setCrop({ x: Math.floor((w - side) / 2), y: Math.floor((h - side) / 2), size: side })
  }, [])

  const beginDrag = (mode: DragState['mode']) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!imgRef.current || !frameRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    dragRef.current = {
      mode,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      orig: { ...crop },
      scale: rect.width / imgRef.current.naturalWidth,
      naturalWidth: imgRef.current.naturalWidth,
      naturalHeight: imgRef.current.naturalHeight,
    }
    frameRef.current.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const dnx = (e.clientX - drag.startClientX) / drag.scale
    const dny = (e.clientY - drag.startClientY) / drag.scale
    const { orig, naturalWidth: W, naturalHeight: H } = drag
    const minSize = Math.max(32, MIN_DISPLAY_PX / drag.scale)
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi))

    if (drag.mode === 'move') {
      setCrop({
        ...orig,
        x: clamp(orig.x + dnx, 0, W - orig.size),
        y: clamp(orig.y + dny, 0, H - orig.size),
      })
      return
    }

    // Resize with the opposite corner anchored (square enforced).
    let size: number
    switch (drag.mode) {
      case 'nw':
        size = clamp(orig.size + Math.max(-dnx, -dny), minSize, Math.min(orig.x + orig.size, orig.y + orig.size))
        setCrop({ x: orig.x + orig.size - size, y: orig.y + orig.size - size, size })
        break
      case 'ne':
        size = clamp(orig.size + Math.max(dnx, -dny), minSize, Math.min(W - orig.x, orig.y + orig.size))
        setCrop({ x: orig.x, y: orig.y + orig.size - size, size })
        break
      case 'sw':
        size = clamp(orig.size + Math.max(-dnx, dny), minSize, Math.min(orig.x + orig.size, H - orig.y))
        setCrop({ x: orig.x + orig.size - size, y: orig.y, size })
        break
      case 'se':
        size = clamp(orig.size + Math.max(dnx, dny), minSize, Math.min(W - orig.x, H - orig.y))
        setCrop({ x: orig.x, y: orig.y, size })
        break
    }
  }

  const endDrag = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    dragRef.current = null
    try {
      frameRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      // Capture may already be gone — nothing to do.
    }
  }

  const confirm = () => {
    if (!natural.width || crop.size < 1) return
    const x = clampInt(crop.x, 0, natural.width - 1)
    const y = clampInt(crop.y, 0, natural.height - 1)
    const size = clampInt(crop.size, 1, Math.min(natural.width - x, natural.height - y))
    onConfirm({ x, y, width: size, height: size })
  }

  return (
    <div className="fg-crop" role="dialog" aria-modal="true" aria-label="Crop your logo">
      <div className="fg-crop__backdrop" onClick={onCancel} />

      <div className="fg-crop__panel">
        <header className="fg-crop__head">
          <div>
            <h2 className="fg-crop__title">Crop your logo</h2>
            <p className="fg-crop__subtitle">
              Drag the box over the portion you want as your favicon — only this area will be converted.
            </p>
          </div>
          <button type="button" className="fg-crop__close" onClick={onCancel} aria-label="Close cropper">
            ×
          </button>
        </header>

        <div className="fg-crop__stage">
          <div
            ref={frameRef}
            className="fg-crop__frame"
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <img
              ref={imgRef}
              src={objectUrl}
              alt="Crop preview"
              className="fg-crop__img"
              draggable={false}
              onLoad={handleImageLoad}
            />

            {scale > 0 && crop.size > 0 && (
              <div
                className="fg-crop__box"
                style={{
                  left: crop.x * scale,
                  top: crop.y * scale,
                  width: crop.size * scale,
                  height: crop.size * scale,
                }}
                onPointerDown={beginDrag('move')}
              >
                <span className="fg-crop__dim">{Math.round(crop.size)} × {Math.round(crop.size)} px</span>
                {(['nw', 'ne', 'sw', 'se'] as Corner[]).map((corner) => (
                  <span
                    key={corner}
                    className={`fg-crop__handle fg-crop__handle--${corner}`}
                    onPointerDown={beginDrag(corner)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="fg-crop__foot">
          <span className="fg-crop__hint">Drag to move · drag a corner to resize</span>
          <div className="fg-crop__actions">
            <Button variant="ghost" onClick={onCancel}>
              Use full image
            </Button>
            <Button onClick={confirm}>Crop &amp; continue</Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

function clampInt(v: number, lo: number, hi: number): number {
  return Math.round(Math.max(lo, Math.min(v, hi)))
}
