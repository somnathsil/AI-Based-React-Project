/**
 * Upload validation for the favicon generator.
 * Treats every upload as untrusted input: extension is not trusted,
 * MIME type, size, and decoded dimensions all must pass.
 */

import type { LoadedImage } from '../types/favicon.types'

export const ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg'] as const
export const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg'] as const

/** 10 MB — generous for a logo, small enough to keep base64 payloads sane. */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/** Favicon source material must be at least this many pixels per side. */
export const MIN_DIMENSION_PX = 32
/** Guard against absurd canvases (memory bombs). */
export const MAX_DIMENSION_PX = 8192

export interface ImageValidationResult {
  valid: boolean
  error?: string
}

export function validateUpload(file: File): ImageValidationResult {
  const name = typeof file.name === 'string' ? file.name.toLowerCase() : ''
  const hasKnownExtension = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))

  if (!hasKnownExtension) {
    return { valid: false, error: 'Please upload a PNG or JPG logo.' }
  }

  // Some browsers report an empty MIME type; extension still gates above.
  // A *wrong* declared type (svg/webp/gif/pdf...) is always rejected.
  if (file.type && !ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
    return { valid: false, error: 'Please upload a PNG or JPG logo.' }
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'This file is too large. Please upload a logo under 10 MB.' }
  }

  return { valid: true }
}

export interface DecodedImageValidationResult {
  valid: boolean
  error?: string
  image?: LoadedImage
}

/**
 * Loads the file through an <img> element (proves the browser can actually
 * decode it) and inspects real dimensions + transparency.
 * Rejects SVG masquerading as PNG/JPG: an SVG served with a fake name will
 * not decode here and is caught by the onerror path.
 */
export function decodeAndValidateImage(objectUrl: string): Promise<DecodedImageValidationResult> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth < MIN_DIMENSION_PX || img.naturalHeight < MIN_DIMENSION_PX) {
        resolve({
          valid: false,
          error: `This image is too small (${img.naturalWidth}×${img.naturalHeight}). Please upload a logo at least ${MIN_DIMENSION_PX}px wide.`,
        })
        return
      }
      if (img.naturalWidth > MAX_DIMENSION_PX || img.naturalHeight > MAX_DIMENSION_PX) {
        resolve({
          valid: false,
          error: 'This image is too large. Please upload a logo under 8192×8192 pixels.',
        })
        return
      }

      detectTransparency(img)
        .then((hasTransparency) => {
          resolve({
            valid: true,
            image: {
              width: img.naturalWidth,
              height: img.naturalHeight,
              hasTransparency,
            },
          })
        })
        .catch(() => {
          // Dimension checks already passed; transparency detection is best-effort.
          resolve({
            valid: true,
            image: {
              width: img.naturalWidth,
              height: img.naturalHeight,
              hasTransparency: false,
            },
          })
        })
    }
    img.onerror = () => {
      resolve({
        valid: false,
        error: 'Unable to read this image. It may be corrupt — please try another PNG or JPG.',
      })
    }
    img.src = objectUrl
  })
}

/** Checks any pixel alpha < 250 via an offscreen canvas. */
async function detectTransparency(img: HTMLImageElement): Promise<boolean> {
  const sample = Math.min(256, Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = sample
  canvas.height = sample
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return false
  ctx.drawImage(img, 0, 0, sample, sample)
  try {
    const { data } = ctx.getImageData(0, 0, sample, sample)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) return true
    }
  } catch {
    return false
  }
  return false
}
