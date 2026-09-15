import { useEffect, useState } from 'react'
import type { IconSearchResult } from '@/services/icon-search/types'
import { fetchMagnificIconSvg } from '@/services/icon-search/providers/magnific'
import { SvgPreview } from '@/components/svg/SvgPreview'
import { SvgCodeViewer } from '@/components/svg/SvgCodeViewer'
import { SvgActions } from '@/components/svg/SvgActions'
import { Button } from '@/components/common/Button'
import './styles.scss'

interface IconDetailProps {
  icon: IconSearchResult
  onClear: () => void
  /** Called when SVG is loaded lazily (e.g. Magnific thumbnail → full SVG). */
  onIconUpdate?: (icon: IconSearchResult) => void
}

function parseMagnificId(iconId: string): number | null {
  const match = /^magnific:(\d+)$/.exec(iconId)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) ? n : null
}

export function IconDetail({ icon, onClear, onIconUpdate }: IconDetailProps) {
  const [resolvedSvg, setResolvedSvg] = useState<string | undefined>(icon.svg)
  const [loadingSvg, setLoadingSvg] = useState(false)
  const [svgError, setSvgError] = useState<string | null>(null)
  const [svgNote, setSvgNote] = useState<string | null>(null)

  useEffect(() => {
    setResolvedSvg(icon.svg)
    setSvgError(null)
    setSvgNote(null)

    if (icon.svg) {
      setLoadingSvg(false)
      return
    }

    if (icon.source !== 'magnific') {
      setLoadingSvg(false)
      return
    }

    const magnificId = parseMagnificId(icon.id)
    if (magnificId == null) {
      setSvgError('Could not load SVG for this icon.')
      return
    }

    let cancelled = false
    setLoadingSvg(true)

    fetchMagnificIconSvg(magnificId, {
      name: icon.name,
      previewUrl: icon.previewUrl,
      style: icon.style,
    })
      .then((result) => {
        if (cancelled) return
        if (!result.svg) {
          setSvgError(
            result.error ||
              'SVG download failed. Add Magnific credits or check OpenRouter key.',
          )
          setLoadingSvg(false)
          return
        }
        setResolvedSvg(result.svg)
        setLoadingSvg(false)
        if (result.source === 'fallback') {
          setSvgNote(
            'Magnific credits unavailable — SVG recreated from icon preview for copy/download.',
          )
        }
        onIconUpdate?.({ ...icon, svg: result.svg })
      })
      .catch(() => {
        if (cancelled) return
        setSvgError('SVG download failed. Try another icon.')
        setLoadingSvg(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [icon.id, icon.svg, icon.source])

  const svg = resolvedSvg

  return (
    <div className="icon-detail">
      <div className="icon-detail__header">
        <h2 className="icon-detail__title">Selected Icon</h2>
        <button className="icon-detail__close" onClick={onClear} aria-label="Close">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="icon-detail__body">
        <div className="icon-detail__preview-container">
          {svg ? (
            <SvgPreview svg={svg} title={icon.name} size="xl" />
          ) : icon.previewUrl ? (
            <div className="icon-detail__preview-image">
              <img src={icon.previewUrl} alt={icon.name} />
            </div>
          ) : null}
        </div>

        <div className="icon-detail__info">
          <h3 className="icon-detail__info-name">{icon.name}</h3>
          <div className="icon-detail__info-meta">
            <span className="icon-detail__info-source">{icon.sourceName}</span>
            {icon.style && (
              <span className="icon-detail__info-style">{icon.style}</span>
            )}
          </div>
        </div>

        {icon.sourceUrl && (
          <a
            className="icon-detail__source-link"
            href={icon.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on {icon.sourceName}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}

        {(icon.license || icon.attributionRequired) && (
          <div className="icon-detail__license">
            {icon.license && (
              <div className="icon-detail__license-info">
                <span className="icon-detail__license-label">License:</span>
                {icon.licenseUrl ? (
                  <a
                    className="icon-detail__license-link"
                    href={icon.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {icon.license}
                  </a>
                ) : (
                  <span className="icon-detail__license-value">{icon.license}</span>
                )}
              </div>
            )}
            {icon.attributionRequired && (
              <div className="icon-detail__attribution">
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
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Attribution required when using this icon</span>
              </div>
            )}
          </div>
        )}

        {loadingSvg && (
          <div className="icon-detail__loading" role="status">
            Loading SVG for copy &amp; download…
          </div>
        )}

        {svgNote && !loadingSvg && (
          <div className="icon-detail__note" role="status">
            {svgNote}
          </div>
        )}

        {svgError && !loadingSvg && (
          <div className="icon-detail__error" role="alert">
            {svgError}
          </div>
        )}

        {svg && <SvgCodeViewer svg={svg} />}

        <div className="icon-detail__actions">
          {svg && <SvgActions svg={svg} prompt={icon.name} />}
        </div>

        <Button variant="ghost" size="sm" onClick={onClear} fullWidth>
          ← Back to results
        </Button>
      </div>
    </div>
  )
}
