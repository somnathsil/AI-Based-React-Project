import type {
  IconSearchProvider,
  IconSearchResult,
  IconSearchOptions,
  IconProviderMeta,
} from '../types'
import { validateSvg, sanitizeSvg, ensureViewBox } from '@/utils/svgSanitizer'

/**
 * Magnific provider.
 *
 * Magnific is an AI icon generation service, not a traditional searchable icon library.
 * This provider uses OpenRouter AI to generate icons based on the user's query,
 * functioning as a generation-based "search" result.
 *
 * This provider requires:
 * - VITE_OPENROUTER_API_KEY (same as the main AI generation)
 *
 * Magnific AI generates unique icons rather than searching a database,
 * so results are AI-generated and may differ between requests.
 */

const MAGNIFIC_SYSTEM_PROMPT = `You are an expert SVG icon designer. Generate a clean, production-ready SVG icon based on the user's description.

Requirements:
- SVG only
- viewBox="0 0 24 24"
- vector elements only (path, circle, rect, line, polyline, polygon, ellipse, g)
- no raster images, base64, external resources, JavaScript, scripts, event handlers
- clean geometry, centered composition, consistent proportions
- suitable for UI usage at small sizes
- use currentColor for fills/strokes so the icon can be recolored

Return ONLY a JSON object:
{
  "title": "Short icon title",
  "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>...</svg>"
}`

const DEFAULT_LIMIT = 4
const REQUEST_TIMEOUT = 15000

function getApiKey(): string {
  return import.meta.env.VITE_OPENROUTER_API_KEY || ''
}

async function generateSingleIcon(
  prompt: string,
  apiKey: string,
  timeoutMs: number,
): Promise<IconSearchResult | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch('/api/openrouter/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PixelCoders - Magnific AI Icon',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: MAGNIFIC_SYSTEM_PROMPT },
          { role: 'user', content: `Generate an SVG icon for: "${prompt}"` },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) return null

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return null

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.svg || typeof parsed.svg !== 'string') return null

    // Validate and sanitize
    const validation = validateSvg(parsed.svg)
    if (!validation.isValid) return null

    const sanitized = sanitizeSvg(parsed.svg)
    const finalSvg = ensureViewBox(sanitized)

    return {
      id: `magnific:${crypto.randomUUID()}`,
      name: parsed.title || `AI: ${prompt}`,
      source: 'magnific',
      sourceName: 'Magnific AI',
      sourceUrl: undefined,
      svg: finalSvg,
      style: 'fill',
      width: 24,
      height: 24,
      license: 'AI Generated',
      attributionRequired: false,
      tags: prompt.split(/\s+/).filter((w: string) => w.length > 1),
    }
  } catch {
    return null
  }
}

export const magnificProvider: IconSearchProvider = {
  meta: {
    id: 'magnific',
    name: 'Magnific AI',
    enabled: true,
    websiteUrl: 'https://magnific.ai',
    supportsSearch: false,
    supportsGeneration: true,
    defaultLicense: 'AI Generated',
  },

  async search(
    query: string,
    options?: IconSearchOptions,
  ): Promise<IconSearchResult[]> {
    const apiKey = getApiKey()
    if (!apiKey) {
      console.info(
        '[Magnific AI] Provider skipped: VITE_OPENROUTER_API_KEY not configured.',
      )
      return []
    }

    const count = Math.min(options?.limit ?? DEFAULT_LIMIT, 4) // Limit AI generations
    const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT

    // Generate multiple variations in parallel
    const prompts = [query]

    // Add style variations if we need more results
    if (count > 1) prompts.push(`${query} outline style`)
    if (count > 2) prompts.push(`${query} minimal style`)
    if (count > 3) prompts.push(`${query} detailed style`)

    const generationPromises = prompts
      .slice(0, count)
      .map((p) => generateSingleIcon(p, apiKey, timeoutMs))

    const settled = await Promise.allSettled(generationPromises)

    const results: IconSearchResult[] = []
    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value)
      }
    }

    return results
  },
}
