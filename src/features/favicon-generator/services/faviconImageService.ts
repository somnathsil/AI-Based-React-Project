/**
 * Image processing for the favicon generator.
 *
 * Executes the AI's validated recommendation: crop → squareify → pad/center
 * → 512×512 master composition. No hardcoded logo rules — every decision
 * comes from the AI analysis; this layer only renders it faithfully.
 * Transparency is preserved unless the AI explicitly requested a solid
 * background.
 */

import type { FaviconAnalysis } from '../types/favicon.types'

export const FAVICON_MASTER_SIZE = 512

function ctxOf(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable in this browser.')
  return ctx
}

function loadImage(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Unable to read this image.'))
    img.src = objectUrl
  })
}

/**
 * Applies the AI's crop (given in analysis-image coordinates) to the
 * full-resolution original image. Crop coordinates are mapped by scale
 * factor, clamped to image bounds, squareified with the AI crop as the
 * anchor base, then scaled by the AI's padding preference.
 *
 * Returns the final source rect in ORIGINAL image pixels.
 */
export function resolveCropRect(
  analysis: FaviconAnalysis,
  analysisImage: { width: number; height: number },
  originalImage: { width: number; height: number },
): { sx: number; sy: number; sw: number; sh: number } {
  const scaleX = originalImage.width / analysisImage.width
  const scaleY = originalImage.height / analysisImage.height

  // Map AI crop (analysis coordinates) into original pixels.
  let cx = analysis.crop.x * scaleX
  let cy = analysis.crop.y * scaleY
  let cw = analysis.crop.width * scaleX
  let ch = analysis.crop.height * scaleY

  // Clamp into the original image.
  cx = Math.max(0, Math.min(cx, originalImage.width - 1))
  cy = Math.max(0, Math.min(cy, originalImage.height - 1))
  cw = Math.max(1, Math.min(cw, originalImage.width - cx))
  ch = Math.max(1, Math.min(ch, originalImage.height - cy))

  // Squareify using the AI's crop as the anchor base (not a hardcoded rule —
  // the AI was instructed to return square crops; this is a safety net).
  const side = Math.max(cw, ch)
  if (cw < side) cx -= (side - cw) / 2
  if (ch < side) cy -= (side - ch) / 2
  cx = Math.max(0, Math.min(cx, originalImage.width - side))
  cy = Math.max(0, Math.min(cy, originalImage.height - side))

  // Apply the AI's padding preference around the selected subject.
  const padding = 1 - analysis.composition.paddingPercent / 100
  const padded = side / padding
  cx -= (padded - side) / 2
  cy -= (padded - side) / 2
  cx = Math.max(0, Math.min(cx, originalImage.width - padded))
  cy = Math.max(0, Math.min(cy, originalImage.height - padded))

  return { sx: cx, sy: cy, sw: padded, sh: padded }
}

export interface ComposeParams {
  objectUrl: string
  analysis: FaviconAnalysis
  analysisImage: { width: number; height: number }
  originalImage: { width: number; height: number }
  /** True when the source image has meaningful transparency. */
  hasTransparency: boolean
}

export interface ComposeResult {
  /** Exactly 512×512 master canvas — the primary generated artwork. */
  masterCanvas: HTMLCanvasElement
  /** Source rect actually used (for the "AI selection" preview overlay). */
  cropRect: { sx: number; sy: number; sw: number; sh: number }
}

/**
 * Renders the AI-selected region into an exact 512×512 canvas.
 * Aspect ratio is preserved (1:1 draw of a square region); nothing is
 * stretched or distorted. Colors are untouched.
 */
export async function composeFavicon({
  objectUrl,
  analysis,
  analysisImage,
  originalImage,
  hasTransparency,
}: ComposeParams): Promise<ComposeResult> {
  const img = await loadImage(objectUrl)
  const { sx, sy, sw, sh } = resolveCropRect(analysis, analysisImage, originalImage)

  const canvas = document.createElement('canvas')
  canvas.width = FAVICON_MASTER_SIZE
  canvas.height = FAVICON_MASTER_SIZE
  const ctx = ctxOf(canvas)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Fill only when the AI explicitly decided a solid background is needed.
  // Otherwise the canvas stays transparent → transparency preserved.
  // (An opaque source like JPG fills the area naturally when drawn.)
  if (analysis.composition.background === 'solid') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, FAVICON_MASTER_SIZE, FAVICON_MASTER_SIZE)
  }

  if (analysis.composition.center) {
    // Centered, uniform scale, fits fully inside the canvas.
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, FAVICON_MASTER_SIZE, FAVICON_MASTER_SIZE)
  } else {
    // AI chose non-centered composition: draw with a slight inset so edges
    // survive favicon sizes, still aspect-true.
    const inset = Math.round(FAVICON_MASTER_SIZE * 0.02)
    ctx.drawImage(
      img,
      sx,
      sy,
      sw,
      sh,
      inset,
      inset,
      FAVICON_MASTER_SIZE - inset * 2,
      FAVICON_MASTER_SIZE - inset * 2,
    )
  }

  return { masterCanvas: canvas, cropRect: { sx, sy, sw, sh } }
}
