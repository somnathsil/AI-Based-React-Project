import type { IconStyleFilter } from '@/store/searchSlice'
import { Button } from '@/components/common/Button'
import './styles.scss'

interface SearchPanelProps {
  query: string
  iconStyle: IconStyleFilter
  iconWidth: number
  iconHeight: number
  isSearching: boolean
  onQueryChange: (val: string) => void
  onIconStyleChange: (val: IconStyleFilter) => void
  onIconWidthChange: (val: number) => void
  onIconHeightChange: (val: number) => void
  onSearch: () => void
  statusMessage?: string
}

export function SearchPanel({
  query,
  iconStyle,
  iconWidth,
  iconHeight,
  isSearching,
  onQueryChange,
  onIconStyleChange,
  onIconWidthChange,
  onIconHeightChange,
  onSearch,
  statusMessage,
}: SearchPanelProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (query.trim() && !isSearching) {
        onSearch()
      }
    }
  }

  return (
    <div className="search-panel">
      <div className="search-panel__header">
        <h2 className="search-panel__title">Discover Icons</h2>
        <p className="search-panel__subtitle">
          Describe any icon and AI will find the best matches from top icon libraries.
        </p>
      </div>

      <div className="search-panel__body">
        {/* Search Input */}
        <div className="search-panel__field">
          <label className="search-panel__label" htmlFor="icon-search">
            What icon are you looking for?
          </label>
          <div className="search-panel__input-wrapper">
            <span className="search-panel__search-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              id="icon-search"
              className="search-panel__input"
              type="text"
              placeholder='e.g. "settings", "dashboard with charts", "shopping cart"'
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSearching}
              autoComplete="off"
            />
          </div>
          <p className="search-panel__hint">
            Enter any icon name or description — AI understands natural language.
          </p>
        </div>

        {/* Quick suggestions */}
        <div className="search-panel__suggestions">
          <span className="search-panel__suggestions-label">Try:</span>
          {['settings', 'dashboard', 'shopping cart', 'notification bell', 'analytics'].map(
            (suggestion) => (
              <button
                key={suggestion}
                className="search-panel__suggestion"
                onClick={() => {
                  onQueryChange(suggestion)
                }}
                disabled={isSearching}
              >
                {suggestion}
              </button>
            ),
          )}
        </div>

        {/* Style Selector */}
        <div className="search-panel__field">
          <label className="search-panel__label">Style</label>
          <div className="search-panel__styles">
            {([
              { value: 'any' as const, label: 'Any', desc: 'All styles', iconPath: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', fill: 'none' },
              { value: 'fill' as const, label: 'Fill', desc: 'Solid filled', iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z', fill: 'currentColor' },
              { value: 'stroke' as const, label: 'Stroke', desc: 'Clean outline', iconPath: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', fill: 'none' },
            ]).map((opt) => (
              <button
                key={opt.value}
                className={`search-panel__style-btn ${iconStyle === opt.value ? 'search-panel__style-btn--active' : ''}`}
                onClick={() => onIconStyleChange(opt.value)}
                disabled={isSearching}
              >
                <span className="search-panel__style-icon">
                  <svg viewBox="0 0 24 24" fill={opt.fill} stroke={opt.fill === 'none' ? 'currentColor' : 'none'} strokeWidth={opt.fill === 'none' ? '1.5' : undefined}>
                    <path d={opt.iconPath} />
                  </svg>
                </span>
                <div className="search-panel__style-text">
                  <span className="search-panel__style-name">{opt.label}</span>
                  <span className="search-panel__style-desc">{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Icon Size */}
        <div className="search-panel__field">
          <label className="search-panel__label">Icon Size</label>
          <div className="search-panel__size-inputs">
            <div className="search-panel__size-group">
              <label className="search-panel__size-label">Width</label>
              <div className="search-panel__size-control">
                <button
                  className="search-panel__size-btn"
                  onClick={() => onIconWidthChange(Math.max(8, iconWidth - 4))}
                  disabled={isSearching || iconWidth <= 8}
                >
                  −
                </button>
                <span className="search-panel__size-value">{iconWidth}</span>
                <button
                  className="search-panel__size-btn"
                  onClick={() => onIconWidthChange(Math.min(128, iconWidth + 4))}
                  disabled={isSearching || iconWidth >= 128}
                >
                  +
                </button>
              </div>
            </div>
            <div className="search-panel__size-group">
              <label className="search-panel__size-label">Height</label>
              <div className="search-panel__size-control">
                <button
                  className="search-panel__size-btn"
                  onClick={() => onIconHeightChange(Math.max(8, iconHeight - 4))}
                  disabled={isSearching || iconHeight <= 8}
                >
                  −
                </button>
                <span className="search-panel__size-value">{iconHeight}</span>
                <button
                  className="search-panel__size-btn"
                  onClick={() => onIconHeightChange(Math.min(128, iconHeight + 4))}
                  disabled={isSearching || iconHeight >= 128}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <p className="search-panel__hint">
            Preferred SVG viewBox dimensions in pixels.
          </p>
        </div>

        {/* Status message */}
        {statusMessage && (
          <div className="search-panel__status">
            <div className="search-panel__status-dot" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Search Button */}
        <Button
          fullWidth
          size="lg"
          loading={isSearching}
          onClick={onSearch}
          disabled={isSearching || !query.trim()}
        >
          {isSearching ? '🔍 Searching...' : '🔍 Search Icons'}
        </Button>
      </div>
    </div>
  )
}
