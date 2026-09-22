import { Loader } from '@/components/common/Loader'
import type { FaviconStage } from '../../types/favicon.types'
import './styles.scss'

interface ProcessingStatusProps {
  stage: FaviconStage
  stageText: string
  error: string | null
}

const ORDER: FaviconStage[] = ['validating', 'analyzing', 'composing', 'rendering', 'converting', 'done']

const LABELS: Record<string, string> = {
  validating: 'Validating upload',
  analyzing: 'AI analyzes your logo',
  composing: 'Finding the best favicon area',
  rendering: 'Creating 512 × 512 master icon',
  converting: 'Building 7 ICO sizes (16 → 512 px)',
}

export function ProcessingStatus({ stage, stageText, error }: ProcessingStatusProps) {
  if (stage === 'idle') return null
  if (stage === 'error') {
    return (
      <section className="fg-card fg-processing fg-processing--error" role="alert">
        <p className="fg-processing__error-title">Conversion failed</p>
        <p className="fg-processing__error-text">{error}</p>
      </section>
    )
  }

  const currentIndex = ORDER.indexOf(stage)
  const isDone = stage === 'done'

  return (
    <section className={`fg-card fg-processing ${isDone ? 'fg-processing--done' : ''}`} aria-live="polite">
      <div className="fg-processing__header">
        {isDone ? (
          <span className="fg-processing__success" aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        ) : (
          <Loader size="sm" />
        )}
        <p className={`fg-processing__text ${isDone ? 'fg-processing__text--done' : ''}`}>{stageText}</p>
      </div>
      <ul className="fg-processing__steps">
        {ORDER.slice(0, -1).map((s, i) => (
          <li
            key={s}
            className={`fg-processing__step ${
              i < currentIndex ? 'fg-processing__step--done' : i === currentIndex ? 'fg-processing__step--active' : ''
            }`}
          >
            <span className="fg-processing__dot" aria-hidden="true">
              {i < currentIndex ? '✓' : ''}
            </span>
            {LABELS[s]}
          </li>
        ))}
      </ul>
    </section>
  )
}
