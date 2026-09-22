import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { Button } from '@/components/common/Button'
import { LogoUploader } from '../../components/LogoUploader'
import { LogoCropper } from '../../components/LogoCropper'
import { ProcessingStatus } from '../../components/ProcessingStatus'
import { FaviconResultPanel } from '../../components/FaviconResultPanel'
import { useFaviconGenerator } from '../../hooks/useFaviconGenerator'
import './styles.scss'

export function FaviconGeneratorPage() {
  const {
    file,
    objectUrl,
    imageInfo,
    stage,
    stageText,
    error,
    result,
    showCropper,
    isProcessing,
    handleFileSelected,
    applyCrop,
    cancelCrop,
    reopenCropper,
    convert,
    download,
    downloadAll,
    reset,
  } = useFaviconGenerator()

  const canConvert = Boolean(file) && !isProcessing

  return (
    <DashboardLayout>
      <div className="fg-page">
        <header className="fg-page__header">
          <Link to="/dashboard" className="fg-page__back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="fg-page__title">
            AI Logo → <span>Favicon Generator</span>
          </h1>
          <p className="fg-page__subtitle">
            Turn any logo into a perfect favicon in seconds — upload, crop, and download.
          </p>
        </header>

        <div className="fg-page__grid">
          <LogoUploader
            objectUrl={objectUrl}
            file={file}
            imageInfo={imageInfo}
            disabled={isProcessing}
            onFileSelected={handleFileSelected}
            onClear={reset}
            onOpenCropper={reopenCropper}
          />

          <section className="fg-card">
            <h2 className="fg-card__title">2. Convert</h2>
            <p className="fg-card__subtitle">
              A vision AI model analyzes the actual pixels of your selected crop area and composes
              the favicon from it.
            </p>
            <Button size="lg" fullWidth onClick={convert} disabled={!canConvert} loading={isProcessing}>
              {isProcessing ? 'Converting…' : 'Convert to Favicon'}
            </Button>
            {!canConvert && !file && !isProcessing && (
              <p className="fg-card__hint">Upload a PNG or JPG logo to enable conversion.</p>
            )}
          </section>

          <ProcessingStatus stage={stage} stageText={stageText} error={error} />

          <FaviconResultPanel
            result={result}
            originalUrl={objectUrl}
            onDownload={download}
            onDownloadAll={downloadAll}
          />
        </div>

        {showCropper && objectUrl && (
          <LogoCropper objectUrl={objectUrl} onConfirm={applyCrop} onCancel={cancelCrop} />
        )}
      </div>
    </DashboardLayout>
  )
}
