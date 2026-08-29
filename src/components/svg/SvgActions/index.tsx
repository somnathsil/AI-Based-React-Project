import { Button } from '@/components/common/Button'
import { showToast } from '@/components/common/Toast'
import { generateFilename } from '@/utils/svgSanitizer'
import './styles.scss'

interface SvgActionsProps {
  svg: string
  prompt: string
  disabled?: boolean
}

export function SvgActions({ svg, prompt, disabled = false }: SvgActionsProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(svg)
      showToast('SVG copied to clipboard', 'success')
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = svg
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      showToast('SVG copied to clipboard', 'success')
    }
  }

  const handleDownload = () => {
    try {
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${generateFilename(prompt)}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showToast('SVG downloaded', 'success')
    } catch {
      showToast('Failed to download SVG', 'error')
    }
  }

  return (
    <div className="svg-actions">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleCopy}
        disabled={disabled}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        Copy SVG
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={handleDownload}
        disabled={disabled}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download SVG
      </Button>
    </div>
  )
}
