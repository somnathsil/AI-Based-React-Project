import type {
  IconSearchProvider,
  IconSearchResult,
  IconSearchOptions,
  IconProviderMeta,
} from '../types'

interface IconifySearchResponse {
  icons: string[]
  total: number
  overrides?: Record<string, unknown>
}

interface IconifyIconData {
  body: string
  width?: number
  height?: number
}

interface IconifyBundleResponse {
  [prefix: string]: {
    [iconName: string]: IconifyIconData
  }
}

const ICONIFY_SEARCH_URL = 'https://api.iconify.design/search'
const ICONIFY_BUNDLE_URL = 'https://api.iconify.design'
const DEFAULT_LIMIT = 30
const REQUEST_TIMEOUT = 10000

/**
 * Font Awesome prefixes available through Iconify.
 * This lets us return FA icons without needing a separate API key.
 */
const FA_PREFIXES = ['fa-solid', 'fa-regular', 'fa-brands']

function buildSearchUrl(query: string, limit: number): string {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
  })
  return `${ICONIFY_SEARCH_URL}?${params.toString()}`
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function inferStyleFromSvg(svgBody: string): string {
  if (/fill\s*=\s*["']none["']/i.test(svgBody)) return 'stroke'
  if (/stroke\s*=/.test(svgBody) && !/fill\s*=/.test(svgBody)) return 'stroke'
  return 'fill'
}

/**
 * Spread results across different prefixes for variety.
 * Ensures we don't get all results from a single icon set.
 */
function spreadResultsAcrossPrefixes(
  results: IconSearchResult[],
  limit: number,
): IconSearchResult[] {
  // Group by sourceName (which includes the prefix info)
  const byPrefix = new Map<string, IconSearchResult[]>()
  for (const r of results) {
    // Extract prefix from id (e.g., "iconify:mdi:home" -> "mdi")
    const parts = r.id.split(':')
    const prefix = parts.length >= 3 ? parts[1] : 'default'
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, [])
    byPrefix.get(prefix)!.push(r)
  }

  // Round-robin across prefixes
  const output: IconSearchResult[] = []
  const iterators = new Map<string, number>()
  for (const p of byPrefix.keys()) iterators.set(p, 0)

  let safety = 0
  while (output.length < limit && safety < limit * 5) {
    safety++
    let added = false
    for (const [prefix, items] of byPrefix) {
      const idx = iterators.get(prefix) ?? 0
      if (idx < items.length && output.length < limit) {
        output.push(items[idx])
        iterators.set(prefix, idx + 1)
        added = true
      }
    }
    if (!added) break
  }

  return output
}

export const iconifyProvider: IconSearchProvider = {
  meta: {
    id: 'iconify',
    name: 'Iconify',
    enabled: true,
    websiteUrl: 'https://iconify.design',
    supportsSearch: true,
    supportsGeneration: false,
    defaultLicense: 'Various (Apache 2.0, MIT, CC-BY, etc.)',
    defaultLicenseUrl: 'https://iconify.design/about/license.html',
  },

  async search(
    query: string,
    options?: IconSearchOptions,
  ): Promise<IconSearchResult[]> {
    const limit = options?.limit ?? DEFAULT_LIMIT
    const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT

    // Step 1: Search for icon identifiers
    // Request extra icons to allow spreading across prefixes
    const searchUrl = buildSearchUrl(query, limit + 30)
    const searchResponse = await fetchWithTimeout(searchUrl, timeoutMs)

    if (!searchResponse.ok) {
      throw new Error(`Iconify search failed: ${searchResponse.status}`)
    }

    const searchData: IconifySearchResponse = await searchResponse.json()

    if (!searchData.icons || searchData.icons.length === 0) {
      return []
    }

    // Spread results across different icon sets (prefixes) for variety
    // Group by prefix first, then pick top results from each prefix
    const byPrefix = new Map<string, string[]>()
    for (const icon of searchData.icons) {
      const colonIndex = icon.indexOf(':')
      if (colonIndex === -1) continue
      const prefix = icon.slice(0, colonIndex)
      if (!byPrefix.has(prefix)) {
        byPrefix.set(prefix, [])
      }
      byPrefix.get(prefix)!.push(icon)
    }

    // Also search with Font Awesome prefixes directly to get more FA results
    const faSearchPromises = FA_PREFIXES.map(async (faPrefix) => {
      try {
        const faUrl = buildSearchUrl(query, 10)
        const faParams = new URLSearchParams({ query, limit: '10', prefix: faPrefix })
        const faResp = await fetchWithTimeout(`${ICONIFY_SEARCH_URL}?${faParams.toString()}`, timeoutMs)
        if (!faResp.ok) return
        const faData: IconifySearchResponse = await faResp.json()
        if (faData.icons) {
          for (const icon of faData.icons) {
            const colonIdx = icon.indexOf(':')
            if (colonIdx === -1) continue
            const prefix = icon.slice(0, colonIdx)
            if (!byPrefix.has(prefix)) byPrefix.set(prefix, [])
            byPrefix.get(prefix)!.push(icon)
          }
        }
      } catch {
        // FA prefix search failed, continue with main results
      }
    })
    await Promise.allSettled(faSearchPromises)

    // Round-robin across prefixes to ensure variety
    const iconIds: string[] = []
    const prefixIterators = new Map<string, number>()
    for (const prefix of byPrefix.keys()) {
      prefixIterators.set(prefix, 0)
    }

    let safety = 0
    while (iconIds.length < limit && safety < limit * 5) {
      safety++
      let addedAny = false
      for (const [prefix, icons] of byPrefix) {
        const idx = prefixIterators.get(prefix) ?? 0
        if (idx < icons.length && iconIds.length < limit) {
          iconIds.push(icons[idx])
          prefixIterators.set(prefix, idx + 1)
          addedAny = true
        }
      }
      if (!addedAny) break
    }

    // Step 2: Fetch SVG data for the found icons (batch by prefix)
    const fetchByPrefix = new Map<string, string[]>()
    for (const icon of iconIds) {
      const colonIndex = icon.indexOf(':')
      if (colonIndex === -1) continue
      const prefix = icon.slice(0, colonIndex)
      const name = icon.slice(colonIndex + 1)
      if (!fetchByPrefix.has(prefix)) {
        fetchByPrefix.set(prefix, [])
      }
      fetchByPrefix.get(prefix)!.push(name)
    }

    const results: IconSearchResult[] = []
    const fetchPromises: Promise<void>[] = []

    for (const [prefix, names] of fetchByPrefix) {
      const params = new URLSearchParams({ icons: names.join(',') })
      const bundleUrl = `${ICONIFY_BUNDLE_URL}/${prefix}.json?${params.toString()}`

      fetchPromises.push(
        fetchWithTimeout(bundleUrl, timeoutMs)
          .then(async (resp) => {
            if (!resp.ok) return
            const bundle: IconifyBundleResponse = await resp.json()
            const prefixData = bundle[prefix]
            if (!prefixData) return

            for (const name of names) {
              const iconData = prefixData[name]
              if (!iconData || !iconData.body) continue

              const svgBody = iconData.body
              const w = iconData.width ?? 24
              const h = iconData.height ?? 24
              const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${svgBody}</svg>`

              results.push({
                id: `iconify:${prefix}:${name}`,
                name: name.replace(/-/g, ' '),
                source: 'iconify',
                sourceName: 'Iconify',
                sourceUrl: `https://iconify.design/icon/${prefix}/${name}.html`,
                svg,
                style: inferStyleFromSvg(svgBody),
                width: w,
                height: h,
                license: 'Various',
                licenseUrl: 'https://iconify.design/about/license.html',
                attributionRequired: false,
                tags: [prefix, name.replace(/-/g, ' ')],
              })
            }
          })
          .catch(() => {
            // Silently fail for individual prefix fetches
          }),
      )
    }

    await Promise.allSettled(fetchPromises)

    // Sort results to spread across prefixes (group by prefix, interleave)
    const sortedResults = spreadResultsAcrossPrefixes(results, limit)

    return sortedResults
  },
}
