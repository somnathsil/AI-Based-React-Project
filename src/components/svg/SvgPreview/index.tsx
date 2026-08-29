import './styles.scss'

interface SvgPreviewProps {
  svg: string
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function SvgPreview({ svg, title, size = 'lg' }: SvgPreviewProps) {
  return (
    <div className={`svg-preview svg-preview--${size}`}>
      <div
        className="svg-preview__canvas"
        dangerouslySetInnerHTML={{ __html: svg }}
        role="img"
        aria-label={title || 'Generated SVG icon'}
      />
    </div>
  )
}
