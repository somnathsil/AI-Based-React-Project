/**
 * Isolated AI service for the favicon generator.
 *
 * IMPORTANT: this file does NOT touch the existing OpenRouter integrations
 * (iconGenerationService / aiQueryService). It performs its own request with
 * its own configurable model so existing behavior is never affected.
 *
 * VISION REQUIREMENT
 * ------------------
 * The uploaded logo is sent to the model as an image_url (data URL) content
 * part, so the configured model MUST accept image input (vision). Configure
 * it with VITE_OPENROUTER_FAVICON_MODEL. The fallback default is
 * "openai/gpt-4o-mini", a vision-capable model — the same family already
 * used by the app's existing OpenRouter features.
 */

import { z } from 'zod'
import type { FaviconAnalysis, FaviconMode, RawFaviconAnalysis } from '../types/favicon.types'

export const FAVICON_VISION_MODEL: string =
  (import.meta.env.VITE_OPENROUTER_FAVICON_MODEL as string | undefined)?.trim() ||
  (import.meta.env.VITE_OPENROUTER_API_MODEL as string | undefined)?.trim() ||
  'openai/gpt-4o-mini'

/** Longest side of the image sent to the vision model (payload control). */
const ANALYSIS_IMAGE_MAX_SIDE = 1024

const MAX_RETRIES = 2

const MODES: FaviconMode[] = [
  'symbol-only',
  'wordmark',
  'full-logo',
  'letter-crop',
  'background-included',
]

const SYSTEM_PROMPT = `You are a favicon design expert. The user uploads a brand logo image. Your job is to analyze it visually and decide which portion works best as a small square favicon (as small as 16×16 px).

You MUST analyze the actual image pixels — never guess from filenames or metadata.

Analyze:
- Whether the logo contains a distinct symbol/icon
- Whether it contains text/wordmark
- Whether symbol and text are combined
- Which portion stays recognizable at tiny sizes
- Whether the full logo is unsuitable as a favicon

Decision rules you apply yourself (no fixed cropping presets):
- Icon + text (horizontal or stacked): usually the symbol alone survives favicon sizes; recommend "symbol-only" and crop to the symbol.
- Single symbol only: preserve the complete symbol ("full-logo" or a tight crop around it).
- Wordmark without a distinct symbol: do NOT arbitrarily delete letters. Pick the treatment that stays most recognizable: "wordmark" (the full text, possibly tightly cropped) or "letter-crop" (a deliberate crop, e.g. an initial or monogram) — explain which and why.
- Decorative background or large empty areas: crop them out unless they carry identity ("background-included" when a background shape IS the identity, e.g. a rounded square app icon).
- Always return a square crop (width === height) in the pixel coordinates of the image you were given. A non-square crop will be center-cropped to a square automatically using your coordinates as the base.

Composition:
- "center": true when the subject should sit in the middle of the favicon canvas
- "paddingPercent": 0-30 of breathing room around the subject (0 for edge-to-edge app-icon style)
- "background": "transparent" to preserve the logo's transparency, or "solid" only when a solid background is genuinely needed for legibility (then say why in the reason)

Return ONLY a JSON object with this exact structure (no markdown, no code fences):
{
  "hasText": <boolean>,
  "hasSymbol": <boolean>,
  "recommendedMode": "<symbol-only|wordmark|full-logo|letter-crop|background-included>",
  "reason": "<one or two sentences explaining the design decision>",
  "crop": { "x": <int>, "y": <int>, "width": <int>, "height": <int> },
  "composition": { "center": <boolean>, "preserveAspectRatio": true, "paddingPercent": <int 0-30>, "background": "<transparent|solid>" }
}`

const analysisSchema = z.object({
  hasText: z.boolean(),
  hasSymbol: z.boolean(),
  recommendedMode: z.enum(MODES as [FaviconMode, ...FaviconMode[]]),
  // The explanation is cosmetic: if the model omits it we fall back instead
  // of discarding an otherwise valid structured analysis.
  reason: z.string().min(1).max(600).catch('The AI selected the most favicon-suitable portion of your logo.'),
  crop: z
    .object({
      x: z.number().finite(),
      y: z.number().finite(),
      width: z.number().finite().positive(),
      height: z.number().finite().positive(),
    })
    .optional(),
  composition: z
    .object({
      center: z.boolean().optional(),
      preserveAspectRatio: z.boolean().optional(),
      paddingPercent: z.number().finite().min(0).max(30).optional(),
      background: z.enum(['transparent', 'solid']).optional(),
    })
    .optional(),
})

function buildUserPrompt(analysisWidth: number, analysisHeight: number): string {
  return [
    `Analyze this logo image (${analysisWidth}×${analysisHeight} pixels) and return the favicon analysis JSON.`,
    `All crop coordinates must be in these same pixel coordinates (origin top-left).`,
    `The crop must be square (width === height).`,
  ].join(' ')
}

/**
 * Renders the uploaded file to a PNG data URL capped at ANALYSIS_IMAGE_MAX_SIDE
 * on the longest side. Returns the data URL plus the actual pixel dimensions
 * the model will see (needed to map crop coordinates back to the original).
 */
export async function prepareAnalysisImage(
  objectUrl: string,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Unable to read this image before analysis.'))
    el.src = objectUrl
  })

  const longest = Math.max(img.naturalWidth, img.naturalHeight)
  const scale = Math.min(1, ANALYSIS_IMAGE_MAX_SIDE / longest)
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable in this browser.')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)
  return { dataUrl: canvas.toDataURL('image/png'), width, height }
}

interface CallVisionModelParams {
  dataUrl: string
  analysisWidth: number
  analysisHeight: number
  apiKey: string
}

async function callVisionModel({
  dataUrl,
  analysisWidth,
  analysisHeight,
  apiKey,
}: CallVisionModelParams): Promise<unknown> {
  const response = await fetch('/api/openrouter/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'PixelCoders - Favicon Generator',
    },
    body: JSON.stringify({
      model: FAVICON_VISION_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: buildUserPrompt(analysisWidth, analysisHeight) },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.2,
      // Reasoning models spend "invisible" thinking tokens from this same
      // budget — 1000 caused finish_reason=length with empty content. 8000
      // leaves room for reasoning plus the JSON answer.
      max_tokens: 8000,
      // Lower reasoning effort and exclude it from the response when the
      // provider supports it (harmlessly ignored by non-reasoning models).
      reasoning: { effort: 'low', exclude: true },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const raw = typeof errorData?.error?.message === 'string' ? errorData.error.message : ''
    if (response.status === 401) {
      throw new Error('AI request was not authorized. Please check the OpenRouter API key.')
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.')
    }
    if (response.status === 404 || /not a valid model|does not support image|no endpoints/i.test(raw)) {
      throw new Error(
        `The configured favicon AI model ("${FAVICON_VISION_MODEL}") is unavailable or cannot process images. Set VITE_OPENROUTER_FAVICON_MODEL to a vision-capable OpenRouter model.`,
      )
    }
    throw new Error(raw || `AI request failed (${response.status}).`)
  }

  const data = await response.json()
  const content: unknown = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || content.trim().length === 0) {
    const finishReason = data?.choices?.[0]?.finish_reason
    throw new Error(
      finishReason === 'length'
        ? 'The AI spent its entire token budget reasoning without answering. Please try again, or set VITE_OPENROUTER_FAVICON_MODEL to a non-reasoning vision model.'
        : 'The AI returned an empty analysis.',
    )
  }
  return extractJson(content)
}

/**
 * Extracts the first JSON object from a model response. Some models wrap
 * JSON in prose or code fences despite instructions.
 */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end <= start) {
    throw new Error('The AI analysis did not contain valid JSON.')
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1))
  } catch {
    throw new Error('The AI analysis returned malformed JSON.')
  }
}

export class FaviconAnalysisError extends Error {
  readonly userMessage: string

  constructor(message: string, userMessage: string) {
    super(message)
    this.name = 'FaviconAnalysisError'
    this.userMessage = userMessage
  }
}

/**
 * Validates the raw model output and maps it onto safe values.
 * Throws FaviconAnalysisError with a user-friendly message when the output
 * is unusable — invalid AI output is never trusted.
 */
export function parseFaviconAnalysis(
  raw: unknown,
  analysisWidth: number,
  analysisHeight: number,
): FaviconAnalysis {
  if (typeof raw !== 'object' || raw === null) {
    throw new FaviconAnalysisError(
      'AI analysis is not an object',
      'Unable to analyze this logo. Please try another PNG or JPG.',
    )
  }
  const r = raw as RawFaviconAnalysis

  const parsed = analysisSchema.safeParse({
    hasText: r.hasText === true || r.hasText === 'true',
    hasSymbol: r.hasSymbol === true || r.hasSymbol === 'true',
    recommendedMode: MODES.includes(r.recommendedMode as FaviconMode)
      ? r.recommendedMode
      : 'full-logo',
    reason: typeof r.reason === 'string' && r.reason.trim() ? r.reason.trim() : undefined,
    crop:
      r.crop &&
      Number.isFinite(Number(r.crop.x)) &&
      Number.isFinite(Number(r.crop.y)) &&
      Number.isFinite(Number(r.crop.width)) &&
      Number.isFinite(Number(r.crop.height))
        ? {
            x: Number(r.crop.x),
            y: Number(r.crop.y),
            width: Number(r.crop.width),
            height: Number(r.crop.height),
          }
        : undefined,
    composition:
      r.composition && typeof r.composition === 'object'
        ? {
            center: r.composition.center === true,
            preserveAspectRatio: r.composition.preserveAspectRatio !== false,
            paddingPercent: Number.isFinite(Number(r.composition.paddingPercent))
              ? Math.min(30, Math.max(0, Number(r.composition.paddingPercent)))
              : undefined,
            background: r.composition.background === 'solid' ? 'solid' : 'transparent',
          }
        : undefined,
  })

  if (!parsed.success) {
    throw new FaviconAnalysisError(
      `AI analysis failed validation: ${parsed.error.issues[0]?.message ?? 'unknown'}`,
      'Unable to analyze this logo. Please try another PNG or JPG.',
    )
  }

  const { crop, composition } = parsed.data
  const reason = parsed.data.reason

  if (!crop) {
    // The model explicitly omitted a crop: treat the full image as the
    // recommendation (squareified by the pipeline). This is the model's
    // decision, not a hardcoded rule.
    return {
      hasText: parsed.data.hasText,
      hasSymbol: parsed.data.hasSymbol,
      recommendedMode: parsed.data.recommendedMode,
      reason,
      crop: { x: 0, y: 0, width: analysisWidth, height: analysisHeight },
      composition: {
        center: composition?.center ?? true,
        preserveAspectRatio: composition?.preserveAspectRatio ?? true,
        paddingPercent: composition?.paddingPercent ?? 8,
        background: composition?.background ?? 'transparent',
      },
    }
  }

  // Clamp the crop into the image; reject degenerate results.
  const x = Math.max(0, Math.min(Math.round(crop.x), analysisWidth - 1))
  const y = Math.max(0, Math.min(Math.round(crop.y), analysisHeight - 1))
  const width = Math.max(8, Math.min(Math.round(crop.width), analysisWidth - x))
  const height = Math.max(8, Math.min(Math.round(crop.height), analysisHeight - y))

  if (width < 8 || height < 8) {
    throw new FaviconAnalysisError(
      `AI crop is degenerate (${width}×${height})`,
      'The AI selected an unusable region of this logo. Please try again or upload a different logo.',
    )
  }

  return {
    hasText: parsed.data.hasText,
    hasSymbol: parsed.data.hasSymbol,
    recommendedMode: parsed.data.recommendedMode,
    reason,
    crop: { x, y, width, height },
    composition: {
      center: composition?.center ?? true,
      preserveAspectRatio: composition?.preserveAspectRatio ?? true,
      paddingPercent: composition?.paddingPercent ?? 8,
      background: composition?.background ?? 'transparent',
    },
  }
}

export interface AnalyzeLogoParams {
  objectUrl: string
  apiKey: string
}

export interface AnalyzeLogoResult {
  analysis: FaviconAnalysis
  /** Scale factor: original pixels = analysis pixels × originalToAnalysis. */
  analysisImage: { width: number; height: number }
  originalImage: { width: number; height: number }
}

/** Runs the full AI analysis with retries on invalid JSON only. */
export async function analyzeLogo({
  objectUrl,
  apiKey,
}: AnalyzeLogoParams): Promise<AnalyzeLogoResult> {
  if (!apiKey) {
    throw new Error('AI analysis is not configured. Please set VITE_OPENROUTER_API_KEY.')
  }

  const prepared = await prepareAnalysisImage(objectUrl)

  let lastError: unknown
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const raw = await callVisionModel({
        dataUrl: prepared.dataUrl,
        analysisWidth: prepared.width,
        analysisHeight: prepared.height,
        apiKey,
      })
      const analysis = parseFaviconAnalysis(raw, prepared.width, prepared.height)
      const originalImage = await imageDimensions(objectUrl)
      return {
        analysis,
        analysisImage: { width: prepared.width, height: prepared.height },
        originalImage,
      }
    } catch (error: unknown) {
      lastError = error
      // Config/auth errors will not improve on retry — surface immediately.
      if (error instanceof FaviconAnalysisError) throw error
      const msg = error instanceof Error ? error.message : ''
      if (/not authorized|Rate limit|vision-capable|unavailable/.test(msg)) throw error
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to analyze this logo. Please try another PNG or JPG.')
}

export async function imageDimensions(objectUrl: string): Promise<{ width: number; height: number }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Unable to read this image.'))
    el.src = objectUrl
  })
  return { width: img.naturalWidth, height: img.naturalHeight }
}
