import type {
  IconSearchProvider,
  IconSearchResult,
  IconSearchOptions,
} from '../types'

/**
 * Remix Icon provider.
 *
 * Remix Icon is a free, open-source icon library with 2,800+ icons
 * in two styles (Line & Fill). Licensed under Apache 2.0.
 * Free for personal and commercial use — no attribution required.
 *
 * SVGs are served from jsdelivr CDN (no API key needed).
 * Icon list is fetched once and cached locally for fast fuzzy search.
 */

const REMIXICON_VERSION = '4.6.0'
const CDN_BASE = `https://cdn.jsdelivr.net/npm/remixicon@${REMIXICON_VERSION}`
const ICONS_LIST_URL = `https://data.jsdelivr.com/v1/packages/npm/remixicon@${REMIXICON_VERSION}?structure=flat`
const DEFAULT_LIMIT = 15
const REQUEST_TIMEOUT = 8000

interface RemixIconEntry {
  /** e.g. "home-2-fill" */
  name: string
  /** Full CDN path e.g. "/icons/Buildings/home-2-fill.svg" */
  path: string
  /** Category e.g. "Buildings" */
  category: string
  /** "fill" or "line" */
  style: 'fill' | 'line'
}

let cachedIcons: RemixIconEntry[] | null = null
let cachePromise: Promise<RemixIconEntry[]> | undefined = undefined

async function fetchIconList(
  timeoutMs: number,
): Promise<RemixIconEntry[]> {
  if (cachedIcons) return cachedIcons
  if (cachePromise) return cachePromise

  cachePromise = (async (): Promise<RemixIconEntry[]> => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      const resp = await fetch(ICONS_LIST_URL, { signal: controller.signal })
      clearTimeout(timer)

      if (!resp.ok) return []

      const data = await resp.json()
      const files: string[] = (data.files ?? [])
        .map((f: { name?: string }) => f.name)
        .filter((n: unknown): n is string => typeof n === 'string')

      const icons: RemixIconEntry[] = []

      for (const filePath of files) {
        // Paths look like: /icons/Buildings/home-2-fill.svg
        if (!filePath.startsWith('/icons/') || !filePath.endsWith('.svg')) continue

        const parts = filePath.split('/')
        // parts: ["", "icons", "Category", "name.svg"]
        if (parts.length < 4) continue

        const category = parts[2]
        const fileName = parts[3].replace('.svg', '')

        // Determine style from filename suffix
        const style: 'fill' | 'line' = fileName.endsWith('-fill')
          ? 'fill'
          : 'line'

        icons.push({
          name: fileName,
          path: filePath,
          category,
          style,
        })
      }

      cachedIcons = icons
      return icons
    } catch {
      return []
    } finally {
      cachePromise = undefined
    }
  })()

  return cachePromise
}

function fuzzyMatch(query: string, iconName: string): number {
  const q = query.toLowerCase().replace(/[-_\s]+/g, '')
  const name = iconName.toLowerCase().replace(/[-_\s]+/g, '')

  if (name === q) return 1.0
  if (name.includes(q)) return 0.9
  if (q.includes(name)) return 0.8

  // Word-level matching
  const queryWords = query.toLowerCase().split(/[-_\s]+/)
  const nameWords = iconName.toLowerCase().split(/[-_\s]+/)
  let matchedWords = 0
  for (const qw of queryWords) {
    for (const nw of nameWords) {
      if (nw === qw || nw.includes(qw) || qw.includes(nw)) {
        matchedWords++
        break
      }
    }
  }
  if (matchedWords > 0) {
    return (matchedWords / queryWords.length) * 0.7
  }

  return 0
}

async function fetchRemixSvg(
  iconPath: string,
  timeoutMs: number,
): Promise<string | null> {
  try {
    const url = `${CDN_BASE}${iconPath}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const resp = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)

    if (!resp.ok) return null

    const text = await resp.text()
    if (!text.includes('<svg')) return null

    return text
  } catch {
    return null
  }
}

export const remixiconProvider: IconSearchProvider = {
  meta: {
    id: 'remixicon',
    name: 'Remix Icon',
    enabled: true,
    websiteUrl: 'https://remixicon.com',
    supportsSearch: true,
    supportsGeneration: false,
    defaultLicense: 'Apache 2.0',
    defaultLicenseUrl: 'https://github.com/Remix-Design/RemixIcon/blob/master/License',
  },

  async search(
    query: string,
    options?: IconSearchOptions,
  ): Promise<IconSearchResult[]> {
    const limit = options?.limit ?? DEFAULT_LIMIT
    const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT

    const allIcons = await fetchIconList(timeoutMs)
    if (allIcons.length === 0) {
      return []
    }

    // Score all icons against the query
    const scored = allIcons
      .map((icon) => ({ icon, score: fuzzyMatch(query, icon.name) }))
      .filter((item) => item.score > 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    if (scored.length === 0) {
      return []
    }

    // Fetch SVGs in parallel
    const results: IconSearchResult[] = []
    const fetches = scored.map(async ({ icon, score }) => {
      const svg = await fetchRemixSvg(icon.path, timeoutMs)
      if (!svg) return

      const displayName = icon.name
        .replace(/-fill$/, '')
        .replace(/-line$/, '')
        .replace(/-/g, ' ')

      results.push({
        id: `remixicon:${icon.name}`,
        name: displayName,
        source: 'remixicon',
        sourceName: 'Remix Icon',
        sourceUrl: `https://remixicon.com/icon/${icon.name}`,
        svg,
        style: icon.style === 'fill' ? 'fill' : 'stroke',
        width: 24,
        height: 24,
        license: 'Apache 2.0',
        licenseUrl: 'https://github.com/Remix-Design/RemixIcon/blob/master/License',
        attributionRequired: false,
        relevanceScore: score,
        tags: [
          icon.category.toLowerCase(),
          icon.name.replace(/-/g, ' '),
          icon.style,
        ],
      })
    })

    await Promise.allSettled(fetches)

    return results.sort(
      (a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0),
    )
  },
}
