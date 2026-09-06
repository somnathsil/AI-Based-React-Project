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
 * Per-provider cap: each provider can contribute at most this many results.
 * This prevents any single provider from dominating the output.
 */
const PER_PROVIDER_CAP = 8

/**
 * Max results from generation-only providers (Magnific AI).
 */
const GENERATION_PROVIDER_CAP = 3

/**
 * Deduplicate results by comparing SVG content similarity.
 * Keep the first occurrence (from the higher-priority provider).
 */
function deduplicateResults(results: IconSearchResult[]): IconSearchResult[] {
  const seen = new Set<string>()
  const unique: IconSearchResult[] = []

  for (const result of results) {
    // Create a fingerprint from SVG content (stripped of whitespace)
    const svgFingerprint = result.svg
      ? result.svg
          .replace(/\s+/g, ' ')
          .replace(/>\s+</g, '><')
          .toLowerCase()
      : `${result.source}:${result.name}`

    if (!seen.has(svgFingerprint)) {
      seen.add(svgFingerprint)
      unique.push(result)
    }
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

  // Search each provider with ALL search terms, cap per provider
  const providerSearchPromises = searchProviders.map(async (provider) => {
    const providerResults: IconSearchResult[] = []

    for (const term of understanding.searchTerms) {
      try {
        const results = await provider.search(term, {
          // Each provider gets a higher limit internally for dedup, but we cap later
          limit: PER_PROVIDER_CAP + 5,
          timeoutMs: options?.timeoutMs ?? 8000,
        })
        providerResults.push(...results)

        // Stop early if this provider already has enough candidates
        if (providerResults.length >= PER_PROVIDER_CAP + 5) break
      } catch (error: unknown) {
        console.warn(
          `[${provider.meta.name}] Search failed for "${term}":`,
          error,
        )
      }
    }

    // Deduplicate within this provider's results
    const unique = deduplicateResults(providerResults)

    // Apply per-provider cap (sort by relevance first)
    const capped = unique
      .sort((a, b) => (b.relevanceScore ?? 0.5) - (a.relevanceScore ?? 0.5))
      .slice(0, PER_PROVIDER_CAP)

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
        timeoutMs: 15000,
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
  const interleaved = buildInterleavedResults(resultsByProvider)

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

  return interleaveResults(byProvider, PER_PROVIDER_CAP * sortedEntries.length + GENERATION_PROVIDER_CAP)
}
