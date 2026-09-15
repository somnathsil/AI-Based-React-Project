import type {
  IconSearchResult,
  IconSearchOptions,
  QueryUnderstanding,
  SearchStatus,
  IconSource,
} from './types'
import type { StyleMode } from '@/utils/svgStyleProcessor'
import { applyStyleToSvg } from '@/utils/svgStyleProcessor'
import { getEnabledProviders, getSearchProviders } from './providerRegistry'
import { understandQuery } from './aiQueryService'

export interface SearchCallbacks {
  onStatusChange: (status: SearchStatus) => void
  onUnderstanding: (understanding: QueryUnderstanding) => void
  onPartialResults: (results: IconSearchResult[]) => void
  onFailedProviders: (sources: IconSource[]) => void
  onComplete: (results: IconSearchResult[], failedProviders: IconSource[]) => void
  onError: (error: string) => void
}

/**
 * Per-provider cap for standard libraries (Iconify / Lucide / Remix).
 */
const PER_PROVIDER_CAP = 15

/**
 * Magnific catalog can return hundreds of matches for one query.
 * Keep a high ceiling so users see as many Magnific icons as practical.
 */
const MAGNIFIC_PROVIDER_CAP = 100

/**
 * Max results from generation-only providers.
 */
const GENERATION_PROVIDER_CAP = 3

function providerResultCap(source: IconSource): number {
  return source === 'magnific' ? MAGNIFIC_PROVIDER_CAP : PER_PROVIDER_CAP
}

/**
 * Deduplicate results by unique id first, then by SVG content.
 * Never fingerprint by display name — Magnific has many icons named "Plus",
 * and name-based dedupe was collapsing them to a single result.
 */
function deduplicateResults(results: IconSearchResult[]): IconSearchResult[] {
  const seenIds = new Set<string>()
  const seenSvg = new Set<string>()
  const unique: IconSearchResult[] = []

  for (const result of results) {
    if (seenIds.has(result.id)) continue
    seenIds.add(result.id)

    if (result.svg) {
      const svgFingerprint = result.svg
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .toLowerCase()

      if (seenSvg.has(svgFingerprint)) continue
      seenSvg.add(svgFingerprint)
    }

    unique.push(result)
  }

  return unique
}

/**
 * Interleave results from different providers so no single source dominates.
 * Round-robins through providers, taking one result at a time from each.
 */
function interleaveResults(
  byProvider: Map<IconSource, IconSearchResult[]>,
  maxTotal: number,
): IconSearchResult[] {
  const result: IconSearchResult[] = []
  const iterators = new Map<IconSource, number>()

  for (const [source] of byProvider) {
    iterators.set(source, 0)
  }

  let safety = 0
  while (result.length < maxTotal && safety < maxTotal * 10) {
    safety++
    let addedAny = false

    for (const [source, items] of byProvider) {
      const idx = iterators.get(source) ?? 0
      if (idx < items.length && result.length < maxTotal) {
        result.push(items[idx])
        iterators.set(source, idx + 1)
        addedAny = true
      }
    }

    if (!addedAny) break
  }

  return result
}

/**
 * Simple relevance scoring based on query overlap with icon name and tags.
 */
function scoreRelevance(
  results: IconSearchResult[],
  understanding: QueryUnderstanding,
): IconSearchResult[] {
  const queryWords = understanding.searchTerms
    .join(' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1)

  return results.map((result) => {
    let score = result.relevanceScore ?? 0.5

    // Boost based on name match
    const nameWords = result.name.toLowerCase().split(/\s+/)
    for (const qw of queryWords) {
      for (const nw of nameWords) {
        if (nw === qw) score += 0.15
        else if (nw.includes(qw) || qw.includes(nw)) score += 0.08
      }
    }

    // Boost based on tag match
    if (result.tags) {
      for (const qw of queryWords) {
        for (const tag of result.tags) {
          const tagLower = tag.toLowerCase()
          if (tagLower === qw) score += 0.1
          else if (tagLower.includes(qw)) score += 0.05
        }
      }
    }

    // Cap at 1.0
    return { ...result, relevanceScore: Math.min(score, 1.0) }
  })
}

/**
 * Main search pipeline.
 *
 * 1. AI understands the query
 * 2. Enabled providers are searched in parallel
 * 3. Results are per-provider capped, deduplicated, interleaved, and ranked
 */
export async function executeSearch(
  query: string,
  apiKey: string,
  callbacks: SearchCallbacks,
  options?: IconSearchOptions,
): Promise<void> {
  const searchProviders = getSearchProviders()
  const allEnabled = getEnabledProviders()

  if (searchProviders.length === 0 && allEnabled.length === 0) {
    callbacks.onError('No icon providers are currently enabled.')
    return
  }

  // Step 1: AI Query Understanding
  callbacks.onStatusChange('understanding')
  let understanding: QueryUnderstanding

  try {
    understanding = await understandQuery(query, apiKey)
    callbacks.onUnderstanding(understanding)
  } catch (error: unknown) {
    // If AI fails, fall back to using the raw query
    console.warn('AI query understanding failed, using raw query:', error)
    understanding = {
      originalQuery: query,
      searchTerms: [query.toLowerCase().trim()],
      intent: query.trim(),
    }
    callbacks.onUnderstanding(understanding)
  }

  // Step 2: Search all enabled providers in parallel
  callbacks.onStatusChange('searching')

  // Collect results per-provider (not mixed yet)
  const resultsByProvider = new Map<IconSource, IconSearchResult[]>()
  const failedProviders: IconSource[] = []

  // Search each provider with search terms, cap per provider
  const providerSearchPromises = searchProviders.map(async (provider) => {
    const providerResults: IconSearchResult[] = []
    let consecutiveErrors = 0

    // Magnific is rate-limited on SVG downloads. Searching every AI synonym
    // (plus, add, addition, ...) caused most downloads to fail and left only
    // one "Plus" after name-based dedupe. Prefer the user's original query.
    const termsForProvider =
      provider.meta.id === 'magnific'
        ? [
            understanding.originalQuery.trim().toLowerCase() ||
              understanding.searchTerms[0],
          ].filter(Boolean)
        : understanding.searchTerms

    for (const term of termsForProvider) {
      try {
        const cap = providerResultCap(provider.meta.id)
        const results = await provider.search(term, {
          limit: cap,
          timeoutMs:
            provider.meta.id === 'magnific'
              ? (options?.timeoutMs ?? 60000)
              : (options?.timeoutMs ?? 25000),
        })
        providerResults.push(...results)
        consecutiveErrors = 0 // Reset on success

        // Stop early if this provider already has enough candidates
        if (providerResults.length >= cap) break
      } catch (error: unknown) {
        consecutiveErrors++
        console.warn(
          `[${provider.meta.name}] Search failed for "${term}" (${consecutiveErrors} consecutive errors):`,
          error,
        )

        // If a provider fails on the first term, don't waste time retrying
        // with other terms — it's likely a network/API issue
        if (consecutiveErrors >= 2) {
          console.warn(
            `[${provider.meta.name}] Skipping remaining search terms due to repeated failures`,
          )
          break
        }
      }
    }

    // Deduplicate within this provider's results
    const unique = deduplicateResults(providerResults)

    // Apply per-provider cap (sort by relevance first)
    const cap = providerResultCap(provider.meta.id)
    const capped = unique
      .sort((a, b) => (b.relevanceScore ?? 0.5) - (a.relevanceScore ?? 0.5))
      .slice(0, cap)

    if (capped.length > 0) {
      resultsByProvider.set(provider.meta.id, capped)
      // Send partial results as they come in (interleaved so far)
      const partial = buildInterleavedResults(resultsByProvider)
      callbacks.onPartialResults(partial)
    } else {
      failedProviders.push(provider.meta.id)
    }

    return capped
  })

  // Also include generation providers (Magnific) with their own cap
  const generationProviders = allEnabled.filter(
    (p) => p.meta.supportsGeneration && !p.meta.supportsSearch,
  )

  const genPromises = generationProviders.map(async (provider) => {
    try {
      const results = await provider.search(query, {
        limit: GENERATION_PROVIDER_CAP,
        // Magnific text-to-icon is async (create task + poll)
        timeoutMs: 90000,
      })

      const capped = results.slice(0, GENERATION_PROVIDER_CAP)
      if (capped.length > 0) {
        resultsByProvider.set(provider.meta.id, capped)
        const partial = buildInterleavedResults(resultsByProvider)
        callbacks.onPartialResults(partial)
      }
    } catch (error: unknown) {
      console.warn(`[${provider.meta.name}] Generation failed:`, error)
      failedProviders.push(provider.meta.id)
    }
  })

  // Wait for all providers to finish
  await Promise.allSettled([...providerSearchPromises, ...genPromises])

  // Step 3: Interleave and deduplicate across providers
  callbacks.onStatusChange('ranking')
  const interleavedRaw = buildInterleavedResults(resultsByProvider)
  const interleaved = deduplicateResults(interleavedRaw)

  // Step 4: Score and rank the interleaved results
  const scored = scoreRelevance(interleaved, understanding)

  // Apply user's preferred style to all SVGs
  const stylePreference = options?.style as StyleMode | undefined
  if (stylePreference === 'fill' || stylePreference === 'stroke') {
    for (const result of scored) {
      if (result.svg) {
        result.svg = applyStyleToSvg(result.svg, stylePreference)
      }
    }
  }

  // Final sort by relevance score (highest first)
  scored.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))

  // Notify failed providers
  if (failedProviders.length > 0) {
    callbacks.onFailedProviders(failedProviders)
  }

  // Step 5: Complete
  callbacks.onStatusChange('complete')
  callbacks.onComplete(scored, failedProviders)
}

/**
 * Build interleaved results from per-provider buckets.
 * Round-robins through providers to balance the output.
 */
function buildInterleavedResults(
  resultsByProvider: Map<IconSource, IconSearchResult[]>,
): IconSearchResult[] {
  // Sort providers alphabetically for deterministic interleaving order
  const sortedEntries = Array.from(resultsByProvider.entries()).sort(
    ([a], [b]) => a.localeCompare(b),
  )

  const byProvider = new Map<IconSource, IconSearchResult[]>(sortedEntries)

  // Include every icon each provider returned (do not cut Magnific back down)
  const maxTotal = Array.from(byProvider.values()).reduce(
    (sum, items) => sum + items.length,
    0,
  )

  return interleaveResults(byProvider, Math.max(maxTotal, 1))
}
