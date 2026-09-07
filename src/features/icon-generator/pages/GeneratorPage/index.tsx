import { useState, useCallback, useMemo } from 'react'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import {
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
} from '@/store/searchSlice'
import { executeSearch } from '@/services/icon-search/searchService'
import type { IconSearchResult } from '@/services/icon-search/types'
import type { IconSource } from '@/services/icon-search/types'
import { SearchPanel } from '@/features/icon-generator/components/SearchPanel'
import { SourceFilter } from '@/features/icon-generator/components/SourceFilter'
import { SearchResultsGrid } from '@/features/icon-generator/components/SearchResultsGrid'
import { IconDetail } from '@/features/icon-generator/components/IconDetail'
import { showToast } from '@/components/common/Toast'
import './styles.scss'

const STATUS_MESSAGES: Record<string, string> = {
  understanding: '🧠 Understanding your request...',
  searching: '🔍 Searching icon libraries...',
  ranking: '📊 Finding the best matches...',
  complete: '',
  error: '',
  idle: '',
}

export function GeneratorPage() {
  const dispatch = useAppDispatch()
  const {
    query,
    iconStyle,
    iconWidth,
    iconHeight,
    status,
    understanding,
    results,
    filteredResults,
    selectedIcon,
    activeFilters,
    failedProviders,
    error,
  } = useAppSelector((state) => state.search)

  const [activeView, setActiveView] = useState<'search' | 'history'>('search')

  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || ''

  const isSearching = status === 'understanding' || status === 'searching' || status === 'ranking'

  const statusMessage = STATUS_MESSAGES[status] || ''

  // Calculate result counts per source for the filter
  const resultCounts = useMemo(() => {
    const counts: Record<IconSource, number> = {} as Record<IconSource, number>
    for (const r of results) {
      counts[r.source] = (counts[r.source] || 0) + 1
    }
    return counts
  }, [results])

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      showToast('Please enter a search term', 'error')
      return
    }

    if (!apiKey) {
      showToast('Please set VITE_OPENROUTER_API_KEY in your .env file', 'error')
      return
    }

    dispatch(setError(null))
    dispatch(setSelectedIcon(null))

    try {
      await executeSearch(
        query.trim(),
        apiKey,
        {
          onStatusChange: (newStatus) => {
            dispatch(setStatus(newStatus))
          },
          onUnderstanding: (u) => {
            dispatch(setUnderstanding(u))
          },
          onPartialResults: (partialResults) => {
            dispatch(setResults(partialResults))
          },
          onFailedProviders: (failed) => {
            dispatch(setFailedProviders(failed))
          },
          onComplete: (finalResults, failed) => {
            dispatch(setResults(finalResults))
            if (failed.length > 0) {
              showToast(
                `${failed.join(' & ')} temporarily unavailable. Showing results from other sources.`,
                'info',
              )
            } else if (finalResults.length === 0) {
              showToast(
                'No matching SVG icons found. Try a different description.',
                'info',
              )
            } else {
              showToast(
                `Found ${finalResults.length} icons from ${new Set(finalResults.map((r) => r.source)).size} source(s)`,
                'success',
              )
            }
          },
          onError: (msg) => {
            dispatch(setError(msg))
            showToast(msg, 'error')
          },
        },
        {
          limit: 20,
          style: iconStyle === 'any' ? undefined : iconStyle,
          minSize: Math.min(iconWidth, iconHeight),
        },
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Search failed'
      dispatch(setError(message))
      showToast(message, 'error')
    }
  }, [query, apiKey, dispatch, iconStyle, iconWidth, iconHeight])

  const handleSelectIcon = useCallback(
    (icon: IconSearchResult) => {
      dispatch(setSelectedIcon(icon))
      // Save to history
      dispatch(addToSearchHistory({ query, selectedIcon: icon }))
    },
    [dispatch, query],
  )

  const handleQueryChange = useCallback(
    (val: string) => {
      dispatch(setQuery(val))
    },
    [dispatch],
  )

  return (
    <div className="generator-page">
      {/* Mobile tab toggle */}
      <div className="generator-page__tabs">
        <button
          className={`generator-page__tab ${activeView === 'search' ? 'generator-page__tab--active' : ''}`}
          onClick={() => setActiveView('search')}
        >
          Search
        </button>
        <button
          className={`generator-page__tab ${activeView === 'history' ? 'generator-page__tab--active' : ''}`}
          onClick={() => setActiveView('history')}
        >
          History
        </button>
      </div>

      <div className={`generator-page__content ${activeView === 'history' ? 'generator-page__content--history' : ''}`}>
        {/* Left panel: Search input */}
        <div className={`generator-page__left ${activeView !== 'search' ? 'generator-page__left--hidden' : ''}`}>
          <SearchPanel
            query={query}
            iconStyle={iconStyle}
            iconWidth={iconWidth}
            iconHeight={iconHeight}
            isSearching={isSearching}
            onQueryChange={handleQueryChange}
            onIconStyleChange={(val) => dispatch(setIconStyle(val))}
            onIconWidthChange={(val) => dispatch(setIconWidth(val))}
            onIconHeightChange={(val) => dispatch(setIconHeight(val))}
            onSearch={handleSearch}
            statusMessage={statusMessage}
          />
        </div>

        {/* Right panel: Results / Detail */}
        <div className={`generator-page__right ${activeView !== 'search' ? 'generator-page__right--hidden' : ''}`}>
          {/* Empty State */}
          {status === 'idle' && !selectedIcon && results.length === 0 && (
            <div className="generator-page__empty">
              <div className="generator-page__empty-icon">🔍</div>
              <h3 className="generator-page__empty-title">Your icon search results will appear here</h3>
              <p className="generator-page__empty-text">
                Describe any icon on the left and AI will find the best matches from top icon libraries.
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="generator-page__error">
              <div className="generator-page__error-icon">⚠️</div>
              <h3 className="generator-page__error-title">Search Error</h3>
              <p className="generator-page__error-text">{error}</p>
            </div>
          )}

          {/* Search Results */}
          {!selectedIcon && results.length > 0 && (
            <div className="generator-page__results-area">
              <SourceFilter
                activeFilters={activeFilters}
                resultCounts={resultCounts}
                onToggleFilter={(source: IconSource) => dispatch(toggleFilter(source))}
                onClearFilters={() => dispatch(clearFilters())}
              />
              <SearchResultsGrid
                results={filteredResults}
                selectedIcon={selectedIcon}
                onSelectIcon={handleSelectIcon}
              />
              {/* Partial provider failure notice */}
              {failedProviders.length > 0 && (
                <div className="generator-page__partial-notice">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>
                    {failedProviders.length === 1
                      ? `${failedProviders[0]} is temporarily unavailable.`
                      : `${failedProviders.join(', ')} are temporarily unavailable.`}
                    {' '}Showing results from available sources.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Selected Icon Detail */}
          {selectedIcon && (
            <IconDetail
              icon={selectedIcon}
              onClear={() => dispatch(setSelectedIcon(null))}
            />
          )}
        </div>

        {/* Mobile history view */}
        <div className={`generator-page__history ${activeView !== 'history' ? 'generator-page__history--hidden' : ''}`}>
          <div className="generator-page__mobile-history">
            <h2 className="generator-page__mobile-history-title">Search History</h2>
            <p className="generator-page__mobile-history-text">
              History is available in the desktop view.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
