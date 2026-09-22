/**
 * PixelCoders — AI Logo → Favicon Generator
 * Isolated feature types. Nothing here is shared with existing features.
 */

/** AI-recommended composition strategy for the favicon. */
export type FaviconMode =
  | 'symbol-only'
  | 'wordmark'
  | 'full-logo'
  | 'letter-crop'
  | 'background-included'

/**
 * Shape the vision model is asked to return. Values are untrusted until
 * validated by `parseFaviconAnalysis` in faviconAiService.
 */
export interface RawFaviconAnalysis {
  hasText?: unknown
  hasSymbol?: unknown
  recommendedMode?: unknown
  reason?: unknown
  crop?: {
    x?: unknown
    y?: unknown
    width?: unknown
    height?: unknown
  }
  composition?: {
    center?: unknown
    preserveAspectRatio?: unknown
    paddingPercent?: unknown
    background?: unknown
  }
}

/** Validated, clamped analysis used by the image pipeline. */
export interface FaviconAnalysis {
  hasText: boolean
  hasSymbol: boolean
  recommendedMode: FaviconMode
  reason: string
  crop: {
    x: number
    y: number
    width: number
    height: number
  }
  composition: {
    center: boolean
    preserveAspectRatio: boolean
    paddingPercent: number
    background: 'transparent' | 'solid'
  }
}

/** Human-readable pipeline stages surfaced in the UI. */
export type FaviconStage =
  | 'idle'
  | 'validating'
  | 'analyzing'
  | 'composing'
  | 'rendering'
  | 'converting'
  | 'done'
  | 'error'

/**
 * One downloadable favicon size as a single-size .ico file.
 * `url` is a blob URL for previewing; `blob` is the actual file payload.
 */
export interface FaviconSizeEntry {
  size: number
  blob: Blob
  url: string
  fileName: string
}

export interface FaviconResult {
  /** Preview blob URL of the 512×512 master composition (PNG). */
  previewUrl: string
  /** Final validated ICO file ready for download. */
  icoBlob: Blob
  /** Download filename, e.g. "pixelcoders-favicon.ico". */
  fileName: string
  /** 512×512 master dimensions. */
  size: number
  /** Every generated size (16/32/48/180/192/512) ready for download. */
  sizes: FaviconSizeEntry[]
  /** Validated AI decision shown to the user. */
  explanation: string
}

/** Minimal image info extracted after decoding (no AI involved). */
export interface LoadedImage {
  width: number
  height: number
  /** True when at least one pixel has alpha < 250 (PNG with transparency). */
  hasTransparency: boolean
}

/**
 * Square crop chosen by the user in the cropper, in NATURAL image pixels.
 * `width === height` — favicons are always square.
 */
export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}
