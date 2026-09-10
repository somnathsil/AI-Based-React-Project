import { getEnabledProviderMetas } from '@/services/icon-search/providerRegistry'
import type { IconSource } from '@/services/icon-search/types'
import './styles.scss'

interface SourceFilterProps {
  activeFilters: IconSource[]
  resultCounts: Record<IconSource, number>
  onToggleFilter: (source: IconSource) => void
  onClearFilters: () => void
  onClearAll?: () => void
}

export function SourceFilter({
  activeFilters,
  resultCounts,
  onToggleFilter,
  onClearFilters,
  onClearAll,
}: SourceFilterProps) {
  const providers = getEnabledProviderMetas()

  // Don't render if there's only one provider
  if (providers.length <= 1) return null

  const totalResults = Object.values(resultCounts).reduce((a, b) => a + b, 0)
  const hasActiveFilters = activeFilters.length > 0

  return (
    <div className="source-filter">
      <div className="source-filter__header">
        <span className="source-filter__label">
          Sources
          {totalResults > 0 && (
            <span className="source-filter__count">{totalResults}</span>
          )}
        </span>
        <button
          className="source-filter__clear"
          onClick={onClearAll ?? onClearFilters}
        >
          Clear
        </button>
      </div>
      <div className="source-filter__chips">
        {providers.map((provider) => {
          const count = resultCounts[provider.id] ?? 0
          const isActive =
            !hasActiveFilters || activeFilters.includes(provider.id)

          return (
            <button
              key={provider.id}
              className={`source-filter__chip ${isActive ? 'source-filter__chip--active' : ''} ${count === 0 ? 'source-filter__chip--empty' : ''}`}
              onClick={() => onToggleFilter(provider.id)}
            >
              <span className="source-filter__chip-name">{provider.name}</span>
              {count > 0 && (
                <span className="source-filter__chip-count">{count}</span>
              )}
            </button>
          )
        })}

      </div>
    </div>
  )
}
