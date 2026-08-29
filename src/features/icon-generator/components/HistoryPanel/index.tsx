import { useAppDispatch } from '@/hooks/useAppDispatch'
import { removeFromHistory } from '@/store/generatorSlice'
import { SvgPreview } from '@/components/svg/SvgPreview'
import { SvgActions } from '@/components/svg/SvgActions'
import type { GeneratedIcon } from '@/types'
import './styles.scss'

interface HistoryPanelProps {
  history: GeneratedIcon[]
  onSelectIcon: (icon: GeneratedIcon) => void
}

export function HistoryPanel({ history, onSelectIcon }: HistoryPanelProps) {
  const dispatch = useAppDispatch()

  if (history.length === 0) {
    return (
      <div className="history-panel">
        <h2 className="history-panel__title">Generation History</h2>
        <div className="history-panel__empty">
          <div className="history-panel__empty-icon">📋</div>
          <h3 className="history-panel__empty-title">No history yet</h3>
          <p className="history-panel__empty-text">
            Generated icons will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="history-panel">
      <h2 className="history-panel__title">Generation History</h2>
      <div className="history-panel__list">
        {history.map((icon) => (
          <div key={icon.id} className="history-item" onClick={() => onSelectIcon(icon)}>
            <div className="history-item__preview">
              <SvgPreview svg={icon.svg} size="sm" />
            </div>
            <div className="history-item__info">
              <h4 className="history-item__name">{icon.title}</h4>
              <p className="history-item__prompt">{icon.prompt}</p>
              <span className="history-item__meta">
                {icon.style} · {new Date(icon.timestamp).toLocaleDateString()}
              </span>
            </div>
            <div className="history-item__actions">
              <SvgActions svg={icon.svg} prompt={icon.prompt} disabled />
              <button
                className="history-item__delete"
                onClick={(e) => {
                  e.stopPropagation()
                  dispatch(removeFromHistory(icon.id))
                }}
                aria-label="Delete from history"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
