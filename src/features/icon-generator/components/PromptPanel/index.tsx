import { useState } from 'react'
import { Button } from '@/components/common/Button'
import type { IconStyle, Complexity, CornerStyle } from '@/types'
import './styles.scss'

interface PromptPanelProps {
  prompt: string
  style: IconStyle
  complexity: Complexity
  cornerStyle: CornerStyle
  iconWidth: number
  iconHeight: number
  isGenerating: boolean
  onPromptChange: (val: string) => void
  onStyleChange: (val: IconStyle) => void
  onComplexityChange: (val: Complexity) => void
  onCornerStyleChange: (val: CornerStyle) => void
  onIconWidthChange: (val: number) => void
  onIconHeightChange: (val: number) => void
  onGenerate: () => void
}

export function PromptPanel({
  prompt,
  style,
  complexity,
  cornerStyle,
  iconWidth,
  iconHeight,
  isGenerating,
  onPromptChange,
  onStyleChange,
  onComplexityChange,
  onCornerStyleChange,
  onIconWidthChange,
  onIconHeightChange,
  onGenerate,
}: PromptPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="prompt-panel">
      <div className="prompt-panel__header">
        <h2 className="prompt-panel__title">Create Your Icon</h2>
        <p className="prompt-panel__subtitle">
          Describe anything and let AI turn your idea into an SVG.
        </p>
      </div>

      <div className="prompt-panel__body">
        {/* Prompt Input */}
        <div className="prompt-panel__field">
          <label className="prompt-panel__label" htmlFor="icon-prompt">
            Description
          </label>
          <textarea
            id="icon-prompt"
            className="prompt-panel__textarea"
            placeholder='Describe an icon, e.g. "modern settings icon"'
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={3}
            disabled={isGenerating}
          />
          <p className="prompt-panel__hint">
            Describe anything — AI will create the SVG.
          </p>
        </div>

        {/* Style Selector */}
        <div className="prompt-panel__field">
          <label className="prompt-panel__label">Style</label>
          <div className="prompt-panel__styles">
            <button
              className={`prompt-panel__style-btn ${style === 'fill' ? 'prompt-panel__style-btn--active' : ''}`}
              onClick={() => onStyleChange('fill')}
              disabled={isGenerating}
            >
              <span className="prompt-panel__style-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <circle cx="12" cy="12" r="8" />
                </svg>
              </span>
              <div className="prompt-panel__style-text">
                <span className="prompt-panel__style-name">Fill</span>
                <span className="prompt-panel__style-desc">Solid filled icon</span>
              </div>
            </button>
            <button
              className={`prompt-panel__style-btn ${style === 'stroke' ? 'prompt-panel__style-btn--active' : ''}`}
              onClick={() => onStyleChange('stroke')}
              disabled={isGenerating}
            >
              <span className="prompt-panel__style-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="8" />
                </svg>
              </span>
              <div className="prompt-panel__style-text">
                <span className="prompt-panel__style-name">Stroke</span>
                <span className="prompt-panel__style-desc">Clean outline icon</span>
              </div>
            </button>
          </div>
        </div>

        {/* Icon Size */}
        <div className="prompt-panel__field">
          <label className="prompt-panel__label">Icon Size</label>
          <div className="prompt-panel__size-inputs">
            <div className="prompt-panel__size-group">
              <label className="prompt-panel__size-label">Width</label>
              <div className="prompt-panel__size-control">
                <button
                  className="prompt-panel__size-btn"
                  onClick={() => onIconWidthChange(Math.max(8, iconWidth - 4))}
                  disabled={isGenerating || iconWidth <= 8}
                >
                  −
                </button>
                <span className="prompt-panel__size-value">{iconWidth}</span>
                <button
                  className="prompt-panel__size-btn"
                  onClick={() => onIconWidthChange(Math.min(128, iconWidth + 4))}
                  disabled={isGenerating || iconWidth >= 128}
                >
                  +
                </button>
              </div>
            </div>
            <div className="prompt-panel__size-group">
              <label className="prompt-panel__size-label">Height</label>
              <div className="prompt-panel__size-control">
                <button
                  className="prompt-panel__size-btn"
                  onClick={() => onIconHeightChange(Math.max(8, iconHeight - 4))}
                  disabled={isGenerating || iconHeight <= 8}
                >
                  −
                </button>
                <span className="prompt-panel__size-value">{iconHeight}</span>
                <button
                  className="prompt-panel__size-btn"
                  onClick={() => onIconHeightChange(Math.min(128, iconHeight + 4))}
                  disabled={isGenerating || iconHeight >= 128}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <p className="prompt-panel__hint">
            SVG viewBox dimensions in pixels.
          </p>
        </div>

        {/* Advanced Settings */}
        <div className="prompt-panel__advanced">
          <button
            className="prompt-panel__advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span>Advanced Settings</span>
            <svg
              className={`prompt-panel__advanced-arrow ${showAdvanced ? 'prompt-panel__advanced-arrow--open' : ''}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showAdvanced && (
            <div className="prompt-panel__advanced-body">
              <div className="prompt-panel__field">
                <label className="prompt-panel__label">Complexity</label>
                <div className="prompt-panel__options">
                  {(['simple', 'medium', 'detailed'] as Complexity[]).map((c) => (
                    <button
                      key={c}
                      className={`prompt-panel__option ${complexity === c ? 'prompt-panel__option--active' : ''}`}
                      onClick={() => onComplexityChange(c)}
                      disabled={isGenerating}
                    >
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="prompt-panel__field">
                <label className="prompt-panel__label">Corners</label>
                <div className="prompt-panel__options">
                  {(['rounded', 'sharp'] as CornerStyle[]).map((c) => (
                    <button
                      key={c}
                      className={`prompt-panel__option ${cornerStyle === c ? 'prompt-panel__option--active' : ''}`}
                      onClick={() => onCornerStyleChange(c)}
                      disabled={isGenerating}
                    >
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <Button
          fullWidth
          size="lg"
          loading={isGenerating}
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? '✨ Generating...' : '✨ Generate SVG'}
        </Button>
      </div>
    </div>
  )
}
