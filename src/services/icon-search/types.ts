/**
 * Icon source identifiers.
 * Extend this union when adding new providers.
 */
export type IconSource =
  | 'iconify'
  | 'magnific'
  | 'lucide'

/**
 * Options passed to a provider's search method.
 */
export interface IconSearchOptions {
  /** Maximum results per provider. */
  limit?: number
  /** Preferred icon style (fill/stroke). */
  style?: 'fill' | 'stroke' | 'any'
  /** Minimum icon width/height. */
  minSize?: number
  /** Timeout in ms for this provider's request. */
  timeoutMs?: number
}

/**
 * Normalized result returned by every provider.
 */
export interface IconSearchResult {
  /** Unique id (provider-prefixed). */
  id: string
  /** Human-readable icon name. */
  name: string
  /** Which provider returned this. */
  source: IconSource
  /** Display name of the source. */
  sourceName: string
  /** URL to the original icon page on the provider's site. */
  sourceUrl?: string
  /** Inline SVG string (may be undefined if only a preview URL is available). */
  svg?: string
  /** URL to a raster preview image (optional). */
  previewUrl?: string
  /** Style hint: 'fill' | 'stroke' | 'outline'. */
  style?: string
  /** Natural width declared by the provider. */
  width?: number
  /** Natural height declared by the provider. */
  height?: number
  /** License identifier (e.g. 'MIT', 'CC-BY-4.0'). */
  license?: string
  /** URL to the license text. */
  licenseUrl?: string
  /** Whether the provider requires attribution. */
  attributionRequired?: boolean
  /** AI-assigned relevance score 0-1. */
  relevanceScore?: number
  /** Tags associated with this icon. */
  tags?: string[]
}

/**
 * Metadata about a registered provider.
 */
export interface IconProviderMeta {
  id: IconSource
  name: string
  enabled: boolean
  /** URL to the provider's homepage. */
  websiteUrl?: string
  /** Whether this provider supports search. */
  supportsSearch: boolean
  /** Whether this provider supports AI generation. */
  supportsGeneration: boolean
  /** License info for the provider as a whole. */
  defaultLicense?: string
  defaultLicenseUrl?: string
}

/**
 * The contract every provider must implement.
 */
export interface IconSearchProvider {
  /** Static metadata. */
  meta: IconProviderMeta

  /**
   * Search for icons matching the given query.
   * Must return an empty array (not throw) on no results.
   */
  search(query: string, options?: IconSearchOptions): Promise<IconSearchResult[]>
}

/**
 * AI-understood query breakdown.
 */
export interface QueryUnderstanding {
  /** The original user query. */
  originalQuery: string
  /** AI-generated search terms to try. */
  searchTerms: string[]
  /** High-level intent description. */
  intent: string
}

/**
 * Search pipeline status for UI feedback.
 */
export type SearchStatus =
  | 'idle'
  | 'understanding'
  | 'searching'
  | 'ranking'
  | 'complete'
  | 'error'

/**
 * Full search state managed by the orchestrator.
 */
export interface SearchPipelineState {
  query: string
  status: SearchStatus
  understanding: QueryUnderstanding | null
  results: IconSearchResult[]
  filteredResults: IconSearchResult[]
  selectedIcon: IconSearchResult | null
  activeFilters: IconSource[]
  failedProviders: IconSource[]
  error: string | null
}
