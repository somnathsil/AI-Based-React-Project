import './styles.scss'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Loader({ size = 'md', className = '' }: LoaderProps) {
  return (
    <div className={`loader loader--${size} ${className}`} aria-label="Loading">
      <div className="loader__spinner" />
    </div>
  )
}
