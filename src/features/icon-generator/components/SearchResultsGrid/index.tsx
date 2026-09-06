import type { IconSearchResult } from '@/services/icon-search/types'
import { SvgPreview } from '@/components/svg/SvgPreview'
import './styles.scss'

interface SearchResultsGridProps {
  results: IconSearchResult[]
  selectedIcon: IconSearchResult | null
  onSelectIcon: (icon: IconSearchResult) => void
}

export function SearchResultsGrid({
  results,
  selectedIcon,
  onSelectIcon,
}: SearchResultsGridProps) {
  if (results.length === 0) return null

  return (
    <div className="results-grid">
      <div className="results-grid__list">
        {results.map((icon) => (
          <button
            key={icon.id}
            className={`results-grid__item ${
              selectedIcon?.id === icon.id ? 'results-grid__item--selected' : ''
            }`}
            onClick={() => onSelectIcon(icon)}
          >
            <div className="results-grid__preview">
              {icon.svg ? (
                <SvgPreview svg={icon.svg} title={icon.name} size="md" />
              ) : icon.previewUrl ? (
                <div className="results-grid__img-wrapper">
                  <img
                    src={icon.previewUrl}
                    alt={icon.name}
                    className="results-grid__img"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="results-grid__placeholder">?</div>
              )}
            </div>
            <div className="results-grid__info">
              <span className="results-grid__name">{icon.name}</span>
              <span className="results-grid__source">{icon.sourceName}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
