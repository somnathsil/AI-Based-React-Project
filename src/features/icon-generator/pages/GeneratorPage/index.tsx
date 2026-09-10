import { useState } from 'react'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import {
  setPrompt,
  setStyle,
  setComplexity,
  setCornerStyle,
  setIconWidth,
  setIconHeight,
  setGenerating,
  setCurrentIcon,
  setError,
  addToHistory,
} from '@/store/generatorSlice'
import { generateSvgIcon } from '@/services/ai/iconGenerationService'
import { PromptPanel } from '@/features/icon-generator/components/PromptPanel'
import { ResultPanel } from '@/features/icon-generator/components/ResultPanel'
import { HistoryPanel } from '@/features/icon-generator/components/HistoryPanel'
import { showToast } from '@/components/common/Toast'
import type { GenerateIconParams } from '@/types'
import './styles.scss'

export function GeneratorPage() {
  const dispatch = useAppDispatch()
  const {
    prompt,
    style,
    complexity,
    cornerStyle,
    iconWidth,
    iconHeight,
    isGenerating,
    currentIcon,
    error,
    history,
  } = useAppSelector((state) => state.generator)

  const [activeView, setActiveView] = useState<'generator' | 'history'>('generator')

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a description for your icon', 'error')
      return
    }

    dispatch(setGenerating(true))
    dispatch(setError(null))

    try {
      const params: GenerateIconParams = {
        prompt: prompt.trim(),
        style,
        size: { width: iconWidth, height: iconHeight },
        complexity,
        cornerStyle,
      }

      const result = await generateSvgIcon(params)
      dispatch(setCurrentIcon(result))
      dispatch(addToHistory(result))
      showToast('SVG generated successfully!', 'success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      dispatch(setError(message))
      showToast(message, 'error')
    } finally {
      dispatch(setGenerating(false))
    }
  }

  const handleRegenerate = async () => {
    await handleGenerate()
  }

  return (
    <div className="generator-page">
      {/* Mobile tab toggle */}
      <div className="generator-page__tabs">
        <button
          className={`generator-page__tab ${activeView === 'generator' ? 'generator-page__tab--active' : ''}`}
          onClick={() => setActiveView('generator')}
        >
          Create
        </button>
        <button
          className={`generator-page__tab ${activeView === 'history' ? 'generator-page__tab--active' : ''}`}
          onClick={() => setActiveView('history')}
        >
          History ({history.length})
        </button>
      </div>

      <div className={`generator-page__content ${activeView === 'history' ? 'generator-page__content--history' : ''}`}>
        <div className={`generator-page__left ${activeView !== 'generator' ? 'generator-page__left--hidden' : ''}`}>
          <PromptPanel
            prompt={prompt}
            style={style}
            complexity={complexity}
            cornerStyle={cornerStyle}
            iconWidth={iconWidth}
            iconHeight={iconHeight}
            isGenerating={isGenerating}
            onPromptChange={(val) => dispatch(setPrompt(val))}
            onStyleChange={(val) => dispatch(setStyle(val))}
            onComplexityChange={(val) => dispatch(setComplexity(val))}
            onCornerStyleChange={(val) => dispatch(setCornerStyle(val))}
            onIconWidthChange={(val) => dispatch(setIconWidth(val))}
            onIconHeightChange={(val) => dispatch(setIconHeight(val))}
            onGenerate={handleGenerate}
          />
        </div>

        <div className={`generator-page__right ${activeView !== 'generator' ? 'generator-page__right--hidden' : ''}`}>
          <ResultPanel
            icon={currentIcon}
            isGenerating={isGenerating}
            error={error}
            onRegenerate={handleRegenerate}
            onClearError={() => dispatch(setError(null))}
          />
        </div>

        <div className={`generator-page__history ${activeView !== 'history' ? 'generator-page__history--hidden' : ''}`}>
          <HistoryPanel
            history={history}
            onSelectIcon={(icon) => {
              dispatch(setCurrentIcon(icon))
              dispatch(setPrompt(icon.prompt))
              dispatch(setStyle(icon.style))
              setActiveView('generator')
            }}
          />
        </div>
      </div>
    </div>
  )
}
