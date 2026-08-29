import './styles.scss'

const steps = [
  {
    number: '01',
    title: 'Describe',
    description: 'Enter any icon name or natural-language description.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'AI Generates',
    description: 'The AI model understands the request and generates the SVG.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    featured: true,
  },
  {
    number: '03',
    title: 'Download',
    description: 'Preview, copy, or download the generated SVG.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
]

export function HowItWorks() {
  return (
    <div className="how-it-works">
      <h2 className="how-it-works__heading">How It Works</h2>
      <div className="how-it-works__steps">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`how-step ${step.featured ? 'how-step--featured' : ''}`}
            style={{ animationDelay: `${0.15 * (i + 1)}s` }}
          >
            <div className="how-step__icon">
              {step.icon}
            </div>
            <div className="how-step__number">{step.number}</div>
            <h3 className="how-step__title">{step.title}</h3>
            <p className="how-step__description">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
