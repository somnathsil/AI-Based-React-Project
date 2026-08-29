import './styles.scss'

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: 'AI Icon Generation',
    description: 'Describe any icon in natural language and let AI generate a new SVG from your idea.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: 'Fill & Stroke Styles',
    description: 'Generate your icon as a solid filled vector or a clean outline SVG.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: 'Production Ready SVG',
    description: 'Get clean, scalable SVG markup that you can copy or download directly into your project.',
  },
]

export function FeatureCards() {
  return (
    <div className="feature-cards">
      <h2 className="feature-cards__heading">Everything you need to create icons with AI</h2>
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
