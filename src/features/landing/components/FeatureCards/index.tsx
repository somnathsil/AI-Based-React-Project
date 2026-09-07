import './styles.scss'

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: 'Multi-Source Search',
    description: 'Search across Iconify, Lucide, Remix Icon, and more — all from a single query.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: 'Fill & Stroke Styles',
    description: 'Filter results by style — find solid filled icons or clean outline strokes.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: 'Copy & Download SVG',
    description: 'Get clean, scalable SVG markup that you can copy or download directly into your project.',
  },
]

export function FeatureCards() {
  return (
    <div className="feature-cards">
      <h2 className="feature-cards__heading">Everything you need to find the perfect icon</h2>
      <div className="feature-cards__grid">
        {features.map((feature, i) => (
          <div
            key={i}
            className="feature-card"
            style={{ animationDelay: `${0.1 * (i + 1)}s` }}
          >
            <div className="feature-card__icon">
              {feature.icon}
            </div>
            <h3 className="feature-card__title">{feature.title}</h3>
            <p className="feature-card__description">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
