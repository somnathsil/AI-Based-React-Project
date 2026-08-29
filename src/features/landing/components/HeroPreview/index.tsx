import './styles.scss'

export function HeroPreview() {
  return (
    <div className="hero-preview">
      <div className="hero-preview__card">
        <div className="hero-preview__top-bar">
          <span className="hero-preview__badge">✨ AI SVG GENERATOR</span>
        </div>

        <div className="hero-preview__input-area">
          <div className="hero-preview__input-label">Describe your icon</div>
          <div className="hero-preview__input-box">
            modern settings icon
          </div>
        </div>

        <div className="hero-preview__styles">
          <span className="hero-preview__style-label">Style</span>
          <div className="hero-preview__style-options">
            <div className="hero-preview__style-option hero-preview__style-option--active">
              <span className="hero-preview__radio">●</span> Fill
            </div>
            <div className="hero-preview__style-option">
              <span className="hero-preview__radio">○</span> Stroke
            </div>
          </div>
        </div>

        <div className="hero-preview__generate-btn">
          ✨ Generate SVG
        </div>

        <div className="hero-preview__arrow">↓</div>

        <div className="hero-preview__result">
          <div className="hero-preview__result-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <div className="hero-preview__result-label">Settings Icon</div>
        </div>

        <div className="hero-preview__download-btn">
          Download SVG
        </div>
      </div>
    </div>
  )
}
