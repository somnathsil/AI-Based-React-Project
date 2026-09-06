import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  IconSearchResult,
  IconSource,
  QueryUnderstanding,
  SearchStatus,
} from '@/services/icon-search/types'
import type { GeneratedIcon } from '@/types'

export type IconStyleFilter = 'any' | 'fill' | 'stroke'

interface SearchState {
  /** Current search query. */
  query: string
  /** Preferred icon style. */
  iconStyle: IconStyleFilter
  /** Preferred icon width. */
  iconWidth: number
  /** Preferred icon height. */
  iconHeight: number
  /** Pipeline status. */
  status: SearchStatus
  /** AI-understood query breakdown. */
  understanding: QueryUnderstanding | null
  /** All results from providers. */
  results: IconSearchResult[]
  /** Results after applying source filters. */
  filteredResults: IconSearchResult[]
  /** Currently selected icon for detail view. */
  selectedIcon: IconSearchResult | null
  /** Active source filters (empty = show all). */
  activeFilters: IconSource[]
  /** Providers that failed during search. */
  failedProviders: IconSource[]
  /** Error message. */
  error: string | null
  /** Search history. */
  searchHistory: SearchHistoryItem[]
}

interface SearchHistoryItem {
  id: string
  query: string
  selectedIcon: IconSearchResult | null
  svg: string
  timestamp: number
  source: IconSource
}

const loadSearchHistory = (): SearchHistoryItem[] => {
  try {
    return JSON.parse(localStorage.getItem('pc_search_history') || '[]')
  } catch {
    return []
  }
}

const initialState: SearchState = {
  query: '',
  iconStyle: 'any',
  iconWidth: 24,
  iconHeight: 24,
  status: 'idle',
  understanding: null,
  results: [],
  filteredResults: [],
  selectedIcon: null,
  activeFilters: [],
  failedProviders: [],
  error: null,
  searchHistory: loadSearchHistory(),
}

function applyFilters(
  results: IconSearchResult[],
  filters: IconSource[],
): IconSearchResult[] {
  if (filters.length === 0) return results
  return results.filter((r) => filters.includes(r.source))
}

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload
    },
    setIconStyle(state, action: PayloadAction<IconStyleFilter>) {
      state.iconStyle = action.payload
    },
    setIconWidth(state, action: PayloadAction<number>) {
      state.iconWidth = action.payload
    },
    setIconHeight(state, action: PayloadAction<number>) {
      state.iconHeight = action.payload
    },
    setStatus(state, action: PayloadAction<SearchStatus>) {
      state.status = action.payload
    },
    setUnderstanding(state, action: PayloadAction<QueryUnderstanding | null>) {
      state.understanding = action.payload
    },
    setResults(state, action: PayloadAction<IconSearchResult[]>) {
      state.results = action.payload
      state.filteredResults = applyFilters(action.payload, state.activeFilters)
    },
    setSelectedIcon(state, action: PayloadAction<IconSearchResult | null>) {
      state.selectedIcon = action.payload
    },
    toggleFilter(state, action: PayloadAction<IconSource>) {
      const source = action.payload
      const idx = state.activeFilters.indexOf(source)
      if (idx === -1) {
        state.activeFilters.push(source)
      } else {
        state.activeFilters.splice(idx, 1)
      }
      state.filteredResults = applyFilters(state.results, state.activeFilters)
    },
    clearFilters(state) {
      state.activeFilters = []
      state.filteredResults = state.results
    },
    setFailedProviders(state, action: PayloadAction<IconSource[]>) {
      state.failedProviders = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
    clearSearch(state) {
      state.query = ''
      state.iconStyle = 'any'
      state.iconWidth = 24
      state.iconHeight = 24
      state.status = 'idle'
      state.understanding = null
      state.results = []
      state.filteredResults = []
      state.selectedIcon = null
      state.activeFilters = []
      state.failedProviders = []
      state.error = null
    },
    addToSearchHistory(
      state,
      action: PayloadAction<{
        query: string
        selectedIcon: IconSearchResult
      }>,
    ) {
      const { query, selectedIcon } = action.payload
      const item: SearchHistoryItem = {
        id: crypto.randomUUID(),
        query,
        selectedIcon,
        svg: selectedIcon.svg || '',
        timestamp: Date.now(),
        source: selectedIcon.source,
      }
      state.searchHistory = [item, ...state.searchHistory].slice(0, 50)
      localStorage.setItem(
        'pc_search_history',
        JSON.stringify(state.searchHistory),
      )
    },
    removeFromSearchHistory(state, action: PayloadAction<string>) {
      state.searchHistory = state.searchHistory.filter(
        (item) => item.id !== action.payload,
      )
      localStorage.setItem(
        'pc_search_history',
        JSON.stringify(state.searchHistory),
      )
    },
    clearSearchHistory(state) {
      state.searchHistory = []
      localStorage.removeItem('pc_search_history')
    },
  },
})

export const {
  setQuery,
  setIconStyle,
  setIconWidth,
  setIconHeight,
  setStatus,
  setUnderstanding,
  setResults,
  setSelectedIcon,
  toggleFilter,
  clearFilters,
  setFailedProviders,
  setError,
  clearSearch,
  addToSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
} = searchSlice.actions

export default searchSlice.reducer

/** Selector to convert search history to GeneratedIcon format for HistoryPanel compatibility. */
export function searchHistoryToGeneratedIcons(
  history: SearchHistoryItem[],
): GeneratedIcon[] {
  return history
    .filter((item) => item.svg)
    .map((item) => ({
      id: item.id,
      svg: item.svg,
      title: item.selectedIcon?.name || item.query,
      description: `From ${item.selectedIcon?.sourceName || 'search'}`,
      style: (item.selectedIcon?.style === 'stroke'
        ? 'stroke'
        : 'fill') as 'fill' | 'stroke',
      prompt: item.query,
      timestamp: item.timestamp,
    }))
}
