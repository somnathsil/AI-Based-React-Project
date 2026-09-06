import type {
  IconSearchProvider,
  IconSearchResult,
  IconSearchOptions,
  IconProviderMeta,
} from '../types'

const LUCIDE_CDN_BASE = 'https://unpkg.com/lucide-static@latest/icons'
const LUCIDE_DATA_URL = 'https://unpkg.com/lucide-static@latest/meta.json'
const DEFAULT_LIMIT = 15
const REQUEST_TIMEOUT = 8000

let cachedIconNames: string[] | null = null
let cachePromise: Promise<string[]> | undefined = undefined

async function fetchIconNames(timeoutMs: number): Promise<string[]> {
  if (cachedIconNames) return cachedIconNames
  if (cachePromise) return cachePromise

  cachePromise = (async (): Promise<string[]> => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      const resp = await fetch(LUCIDE_DATA_URL, { signal: controller.signal })
      clearTimeout(timer)

      if (!resp.ok) return []

      const data = await resp.json()
      // meta.json has structure like { icons: [{ name: "icon-name", ... }], ... }
      if (Array.isArray(data?.icons)) {
        const names: string[] = data.icons
          .map((icon: { name?: string }) => icon.name)
          .filter((n: unknown): n is string => typeof n === 'string' && n.length > 0)
        cachedIconNames = names
        return names
      }

      // Alternative: data might be an object with icon names as keys
      if (typeof data === 'object' && data !== null) {
        const names = Object.keys(data).filter(
          (k) => typeof data[k] === 'object' && data[k] !== null,
        )
        if (names.length > 0) {
          cachedIconNames = names
          return names
        }
      }

      return []
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

async function fetchLucideSvg(
  iconName: string,
  timeoutMs: number,
): Promise<string | null> {
  try {
    const url = `${LUCIDE_CDN_BASE}/${iconName}.svg`
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

export const lucideProvider: IconSearchProvider = {
  meta: {
    id: 'lucide',
    name: 'Lucide',
    enabled: true,
    websiteUrl: 'https://lucide.dev',
    supportsSearch: true,
    supportsGeneration: false,
    defaultLicense: 'ISC',
    defaultLicenseUrl: 'https://lucide.dev/license',
  },

  async search(
    query: string,
    options?: IconSearchOptions,
  ): Promise<IconSearchResult[]> {
    const limit = options?.limit ?? DEFAULT_LIMIT
    const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT

    const allNames = await fetchIconNames(timeoutMs)
    if (allNames.length === 0) {
      // Fallback: try to directly fetch common icon names based on query words
      return fallbackSearch(query, limit, timeoutMs)
    }

    // Score all icons against the query
    const scored = allNames
      .map((name) => ({ name, score: fuzzyMatch(query, name) }))
      .filter((item) => item.score > 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    if (scored.length === 0) {
      return []
    }

    // Fetch SVGs in parallel
    const results: IconSearchResult[] = []
    const fetches = scored.map(async ({ name, score }) => {
      const svg = await fetchLucideSvg(name, timeoutMs)
      if (!svg) return

      results.push({
        id: `lucide:${name}`,
        name: name.replace(/-/g, ' '),
        source: 'lucide',
        sourceName: 'Lucide',
        sourceUrl: `https://lucide.dev/icons/${name}`,
        svg,
        style: 'stroke',
        width: 24,
        height: 24,
        license: 'ISC',
        licenseUrl: 'https://lucide.dev/license',
        attributionRequired: false,
        relevanceScore: score,
        tags: name.split('-'),
      })
    })

    await Promise.allSettled(fetches)

    return results.sort(
      (a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0),
    )
  },
}

/**
 * Fallback search when icon list can't be fetched.
 * Tries to directly fetch icons matching query words from the CDN.
 */
async function fallbackSearch(
  query: string,
  limit: number,
  timeoutMs: number,
): Promise<IconSearchResult[]> {
  // Generate candidate names from query words
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1)

  const candidates = new Set<string>()

  // Add individual words
  for (const word of words) {
    candidates.add(word)
  }

  // Add common suffixes/prefixes
  const commonPrefixes = ['', '']
  const commonSuffixes = ['', '-icon', '']

  for (const word of words) {
    for (const prefix of commonPrefixes) {
      for (const suffix of commonSuffixes) {
        candidates.add(`${prefix}${word}${suffix}`)
      }
    }
  }

  // Add multi-word combinations
  if (words.length > 1) {
    candidates.add(words.join('-'))
    candidates.add(words.slice(0, 2).join('-'))
  }

  const results: IconSearchResult[] = []
  const fetches: Promise<void>[] = []

  for (const candidate of candidates) {
    if (results.length >= limit) break

    fetches.push(
      fetchLucideSvg(candidate, timeoutMs).then((svg) => {
        if (!svg || results.length >= limit) return
        results.push({
          id: `lucide:${candidate}`,
          name: candidate.replace(/-/g, ' '),
          source: 'lucide',
          sourceName: 'Lucide',
          sourceUrl: `https://lucide.dev/icons/${candidate}`,
          svg,
          style: 'stroke',
          width: 24,
          height: 24,
          license: 'ISC',
          licenseUrl: 'https://lucide.dev/license',
          attributionRequired: false,
          tags: candidate.split('-'),
        })
      }),
    )
  }

  await Promise.allSettled(fetches)
  return results
}
