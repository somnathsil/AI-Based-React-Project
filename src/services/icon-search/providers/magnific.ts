import type {
  IconSearchProvider,
  IconSearchResult,
  IconSearchOptions,
} from '../types'
import { validateSvg, sanitizeSvg, ensureViewBox } from '@/utils/svgSanitizer'

/**
 * Magnific AI provider (paid account).
 *
 * Search returns catalog thumbnails only (no bulk SVG downloads — those cost
 * Magnific credits and were returning HTTP 402 once credits ran out).
 *
 * SVG is fetched on icon click via fetchMagnificIconSvg():
 *   1) Magnific paid download API
 *   2) OpenRouter vision fallback (recreates vector SVG from the thumbnail)
 */

const MAGNIFIC_API_BASE = '/api/magnific'
const DEFAULT_LIMIT = 100
const MAX_LIMIT = 100
const PER_PAGE = 100
const REQUEST_TIMEOUT = 20000

interface MagnificIconItem {
  id: number
  name?: string
  slug?: string
  free_svg?: boolean
  style?: { id?: number; name?: string }
  family?: { id?: number; name?: string }
  tags?: Array<string | { name?: string }>
  thumbnails?: Array<{ width?: number; height?: number; url?: string }>
}

interface MagnificIconsResponse {
  data?: MagnificIconItem[]
  meta?: {
    pagination?: {
      total?: number
      last_page?: number
      per_page?: number
      current_page?: number
    }
  }
}

interface MagnificDownloadResponse {
  data?: {
    filename?: string
    url?: string
  }
  message?: string
}

function hasApiKeyConfigured(): boolean {
  return import.meta.env.VITE_MAGNIFIC_ENABLED !== 'false'
}

function getOpenRouterKey(): string {
  return import.meta.env.VITE_OPENROUTER_API_KEY || ''
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function inferStyle(styleName?: string): string {
  const s = (styleName || '').toLowerCase()
  if (s.includes('outline') || s.includes('line') || s.includes('stroke')) {
    return 'stroke'
  }
  return 'fill'
}

function extractTags(item: MagnificIconItem): string[] {
  const tags: string[] = []
  if (item.style?.name) tags.push(item.style.name)
  if (item.family?.name) tags.push(item.family.name)
  if (Array.isArray(item.tags)) {
    for (const tag of item.tags) {
      if (typeof tag === 'string') tags.push(tag)
      else if (tag?.name) tags.push(tag.name)
    }
  }
  return tags
}

function thumbnailUrl(item: MagnificIconItem): string | undefined {
  const thumbs = item.thumbnails || []
  // Prefer larger preview for detail / vision fallback
  const sorted = [...thumbs].sort(
    (a, b) => (b.width || 0) - (a.width || 0),
  )
  return sorted.find((t) => t.url)?.url || thumbs[0]?.url
}

/** Build Magnific PNG CDN URL from catalog id when thumbnails are missing. */
export function magnificThumbnailUrl(
  iconId: number,
  size: 128 | 256 | 512 = 512,
): string {
  const folder = Math.floor(iconId / 1000)
  return `https://cdn-icons-png.magnific.com/${size}/${folder}/${iconId}.png`
}

function scoreMatch(query: string, item: MagnificIconItem): number {
  const q = query.toLowerCase().trim()
  const name = (item.name || '').toLowerCase()
  const slug = (item.slug || '').toLowerCase()
  const tagText = extractTags(item).join(' ').toLowerCase()

  if (!q) return 0.5
  if (name === q || slug === q) return 1
  if (name.includes(q) || slug.includes(q)) return 0.9

  const synonymGroups = [
    ['plus', 'add', 'addition', 'positive', 'cross'],
    ['minus', 'subtract', 'remove', 'dash'],
    ['close', 'cancel', 'x', 'times'],
    ['search', 'find', 'magnifier', 'magnifying'],
    ['house', 'home', 'building'],
  ]
  const qWords = new Set(q.split(/\s+/).filter((w) => w.length > 1))
  for (const group of synonymGroups) {
    if (group.some((w) => qWords.has(w) || q === w)) {
      if (
        group.some(
          (w) => name.includes(w) || slug.includes(w) || tagText.includes(w),
        )
      ) {
        return 0.85
      }
    }
  }

  const words = q.split(/\s+/).filter((w) => w.length > 1)
  let hits = 0
  for (const w of words) {
    if (name.includes(w) || slug.includes(w) || tagText.includes(w)) hits++
  }
  if (hits === 0) return 0.35
  return 0.4 + (hits / words.length) * 0.4
}

function finalizeSvg(raw: string): string | null {
  const validation = validateSvg(raw)
  if (!validation.isValid) return null
  return ensureViewBox(sanitizeSvg(raw))
}

async function downloadSvgFromMagnific(
  iconId: number,
  timeoutMs: number,
): Promise<{ svg: string | null; error?: string; status?: number }> {
  try {
    const downloadRes = await fetchWithTimeout(
      `${MAGNIFIC_API_BASE}/v1/icons/${iconId}/download?format=svg`,
      { method: 'GET' },
      timeoutMs,
    )

    if (!downloadRes.ok) {
      const body = (await downloadRes.json().catch(() => ({}))) as {
        message?: string
      }
      return {
        svg: null,
        status: downloadRes.status,
        error: body.message || `HTTP ${downloadRes.status}`,
      }
    }

    const payload = (await downloadRes.json()) as MagnificDownloadResponse
    const assetUrl = payload.data?.url
    if (!assetUrl) {
      return { svg: null, error: payload.message || 'No download URL' }
    }

    const proxied = `/api/svg-asset?url=${encodeURIComponent(assetUrl)}`
    const svgRes = await fetchWithTimeout(proxied, { method: 'GET' }, timeoutMs)
    if (!svgRes.ok) {
      return { svg: null, error: `CDN fetch failed (${svgRes.status})` }
    }

    const text = await svgRes.text()
    if (!text.includes('<svg')) {
      return { svg: null, error: 'CDN response was not SVG' }
    }

    const finalSvg = finalizeSvg(text)
    if (!finalSvg) return { svg: null, error: 'SVG failed validation' }
    return { svg: finalSvg }
  } catch (error) {
    return {
      svg: null,
      error: error instanceof Error ? error.message : 'Download failed',
    }
  }
}

/**
 * When Magnific credits are exhausted (402), recreate a clean vector SVG
 * from the catalog thumbnail using OpenRouter vision.
 */
async function generateSvgFromThumbnail(params: {
  name: string
  previewUrl: string
  style?: string
  timeoutMs?: number
}): Promise<string | null> {
  const apiKey = getOpenRouterKey()
  if (!apiKey) return null

  const timeoutMs = params.timeoutMs ?? 30000
  const styleHint =
    params.style === 'stroke'
      ? 'outline / stroke style, fill="none", stroke="currentColor"'
      : 'filled style, use currentColor for fills'

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch('/api/openrouter/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PixelCoders - Magnific SVG Fallback',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You convert icon images into clean production SVG markup.
Return ONLY a JSON object: {"svg":"<svg ...>...</svg>"}.
Requirements:
- viewBox="0 0 24 24"
- vector only (path, circle, rect, line, polyline, polygon, ellipse, g)
- no raster, no base64, no scripts
- ${styleHint}
- match the icon silhouette and proportions as closely as possible`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Recreate this Magnific icon as SVG. Icon name: "${params.name}".`,
              },
              {
                type: 'image_url',
                image_url: { url: params.previewUrl },
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) return null

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') return null

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as { svg?: string }
        if (parsed.svg) {
          const finalSvg = finalizeSvg(parsed.svg)
          if (finalSvg) return finalSvg
        }
      } catch {
        // fall through to raw SVG extract
      }
    }

    const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i)
    if (svgMatch) return finalizeSvg(svgMatch[0])

    return null
  } catch {
    return null
  }
}

export interface FetchMagnificSvgOptions {
  name?: string
  previewUrl?: string
  style?: string
  timeoutMs?: number
}

/**
 * Resolve SVG for a Magnific catalog icon (used when user opens icon detail).
 */
export async function fetchMagnificIconSvg(
  iconId: number,
  options?: FetchMagnificSvgOptions,
): Promise<{ svg: string | null; source: 'magnific' | 'fallback' | null; error?: string }> {
  const timeoutMs = options?.timeoutMs ?? 20000

  const fromApi = await downloadSvgFromMagnific(iconId, timeoutMs)
  if (fromApi.svg) {
    return { svg: fromApi.svg, source: 'magnific' }
  }

  const previewUrl =
    options?.previewUrl || magnificThumbnailUrl(iconId, 512)
  const name = options?.name || `Icon ${iconId}`

  console.warn(
    `[Magnific AI] Paid SVG download failed (${fromApi.error}). Using vision fallback for "${name}".`,
  )

  const fallback = await generateSvgFromThumbnail({
    name,
    previewUrl,
    style: options?.style,
    timeoutMs: 35000,
  })

  if (fallback) {
    return { svg: fallback, source: 'fallback' }
  }

  return {
    svg: null,
    source: null,
    error:
      fromApi.status === 402
        ? 'Magnific account has insufficient credits for SVG download, and fallback generation also failed.'
        : fromApi.error || 'Could not load SVG for this icon.',
  }
}

/** Fetch multiple Magnific catalog pages until we hit `limit` or run out. */
async function fetchAllCatalogPages(
  term: string,
  limit: number,
  timeoutMs: number,
): Promise<MagnificIconItem[]> {
  const collected: MagnificIconItem[] = []
  const seen = new Set<number>()
  let page = 1
  let lastPage = 1

  while (collected.length < limit && page <= lastPage) {
    const params = new URLSearchParams({
      term,
      per_page: String(PER_PAGE),
      page: String(page),
      order: 'relevance',
    })

    const response = await fetchWithTimeout(
      `${MAGNIFIC_API_BASE}/v1/icons?${params.toString()}`,
      { method: 'GET' },
      Math.min(timeoutMs, 15000),
    )

    if (!response.ok) {
      if (page === 1) {
        if (response.status === 401) {
          console.warn(
            '[Magnific AI] Unauthorized — check MAGNIFIC_API_KEY (restart Vite after changing .env).',
          )
        } else {
          console.warn(
            `[Magnific AI] Icons search failed: HTTP ${response.status}`,
          )
        }
      }
      break
    }

    const data = (await response.json()) as MagnificIconsResponse
    const batch = Array.isArray(data.data) ? data.data : []
    lastPage = data.meta?.pagination?.last_page ?? page

    if (batch.length === 0) break

    for (const item of batch) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      collected.push(item)
      if (collected.length >= limit) break
    }

    page++
  }

  return collected
}

export const magnificProvider: IconSearchProvider = {
  meta: {
    id: 'magnific',
    name: 'Magnific AI',
    enabled: true,
    websiteUrl: 'https://www.magnific.com',
    supportsSearch: true,
    supportsGeneration: true,
    defaultLicense: 'Magnific License',
    defaultLicenseUrl: 'https://www.magnific.com/legal/terms-of-use',
  },

  async search(
    query: string,
    options?: IconSearchOptions,
  ): Promise<IconSearchResult[]> {
    if (!hasApiKeyConfigured()) {
      console.info(
        '[Magnific AI] Provider skipped: set MAGNIFIC_API_KEY in .env (paid account API key).',
      )
      return []
    }

    const limit = Math.min(options?.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
    const timeoutMs = Math.max(options?.timeoutMs ?? REQUEST_TIMEOUT, REQUEST_TIMEOUT)
    const term = query.trim()
    if (!term) return []

    let items: MagnificIconItem[] = []
    try {
      items = await fetchAllCatalogPages(term, limit, timeoutMs)
    } catch (error) {
      console.warn('[Magnific AI] Icons search request failed:', error)
      return []
    }

    if (items.length === 0) return []

    // Thumbnails only — SVG is loaded on click to avoid burning Magnific credits
    const results: IconSearchResult[] = items.map((item, index) => {
      const thumb = thumbnailUrl(item) || magnificThumbnailUrl(item.id)
      return {
        id: `magnific:${item.id}`,
        name: item.name || item.slug || `Icon ${item.id}`,
        source: 'magnific' as const,
        sourceName: 'Magnific AI',
        sourceUrl: `https://www.magnific.com/icon/${item.id}`,
        previewUrl: thumb,
        style: inferStyle(item.style?.name),
        width: 24,
        height: 24,
        license: 'Magnific License',
        licenseUrl: 'https://www.magnific.com/legal/terms-of-use',
        attributionRequired: false,
        relevanceScore:
          scoreMatch(term, item) + Math.max(0, 0.2 - index * 0.001),
        tags: extractTags(item),
      }
    })

    console.info(
      `[Magnific AI] Returned ${results.length} icons for "${term}" (SVG loads on click)`,
    )

    return results.sort(
      (a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0),
    )
  },
}
