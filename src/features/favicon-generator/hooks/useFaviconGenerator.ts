import { useCallback, useRef, useState } from 'react'
import { showToast } from '@/components/common/Toast'
import { validateUpload, decodeAndValidateImage } from '../utils/imageValidation'
import { analyzeLogo } from '../services/faviconAiService'
import { composeFavicon, FAVICON_MASTER_SIZE } from '../services/faviconImageService'
import {
  generateIcoFromCanvas,
  generateSingleSizeIco,
  validateIco,
  normalizeIcoBlob,
} from '../services/icoGeneratorService'
import { createZip } from '../services/zipService'
import type { CropRect, FaviconResult, FaviconSizeEntry, FaviconStage } from '../types/favicon.types'

/** Every icon size generated from the 512×512 master, available for download. */
const DOWNLOAD_SIZES = [16, 32, 48, 180, 192, 512] as const

const STAGE_MESSAGES: Record<FaviconStage, string> = {
  idle: '',
  validating: 'Validating your logo…',
  analyzing: 'Analyzing your logo…',
  composing: 'Finding the best favicon area…',
  rendering: 'Creating 512 × 512 favicon…',
  converting: 'Converting to ICO…',
  done: 'Favicon ready!',
  error: '',
}

export function stageMessage(stage: FaviconStage): string {
  return STAGE_MESSAGES[stage]
}

export function useFaviconGenerator() {
  const [file, setFile] = useState<File | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number; hasTransparency: boolean } | null>(null)
  const [stage, setStage] = useState<FaviconStage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FaviconResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)

  const processingRef = useRef(false)
  const resultUrlRef = useRef<string | null>(null)
  const sizeUrlsRef = useRef<string[]>([])

  const revokeSizeUrls = useCallback(() => {
    sizeUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    sizeUrlsRef.current = []
  }, [])

  const reset = useCallback(() => {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
    resultUrlRef.current = null
    revokeSizeUrls()
    setFile(null)
    setObjectUrl(null)
    setImageInfo(null)
    setStage('idle')
    setError(null)
    setResult(null)
    setPreviewUrl(null)
    setShowCropper(false)
  }, [objectUrl, revokeSizeUrls])

  const handleFileSelected = useCallback(
    async (selected: File, openCropper = true) => {
      // Fast path validation happens in the uploader; this is the
      // authoritative gate. Any new selection invalidates the old result.
      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current)
        resultUrlRef.current = null
      }
      revokeSizeUrls()
      setResult(null)
      setError(null)
      setStage('idle')
      setPreviewUrl(null)

      const check = validateUpload(selected)
      if (!check.valid) {
        showToast(check.error ?? 'Please upload a PNG or JPG logo.', 'error')
        return
      }

      const url = URL.createObjectURL(selected)
      const decoded = await decodeAndValidateImage(url)
      if (!decoded.valid || !decoded.image) {
        URL.revokeObjectURL(url)
        showToast(decoded.error ?? 'Unable to read this image.', 'error')
        return
      }

      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setFile(selected)
      setObjectUrl(url)
      setImageInfo(decoded.image)
      // Fresh upload → open the cropper so the user picks the exact
      // favicon area. Programmatic re-selections (applied crops) skip this.
      if (openCropper) setShowCropper(true)
    },
    [objectUrl],
  )

  /**
   * Crops the current logo at natural resolution and makes the result the
   * new conversion source. Reuses the normal selection path (validation,
   * decoding, object URL lifecycle) so everything downstream — AI analysis,
   * composition, ICO conversion — operates on exactly the user's selection.
   */
  const applyCrop = useCallback(
    async (rect: CropRect) => {
      if (!objectUrl) return
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.onerror = () => reject(new Error('Unable to read this image.'))
          image.src = objectUrl
        })

        const x = Math.max(0, Math.min(Math.round(rect.x), img.naturalWidth - 1))
        const y = Math.max(0, Math.min(Math.round(rect.y), img.naturalHeight - 1))
        const w = Math.max(1, Math.min(Math.round(rect.width), img.naturalWidth - x))
        const h = Math.max(1, Math.min(Math.round(rect.height), img.naturalHeight - y))

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas is unavailable in this browser.')
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h)

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
        if (!blob) throw new Error('Unable to process the cropped logo. Please try again.')

        const base =
          (file?.name ?? 'logo')
            .replace(/\.[^.]+$/, '')
            .replace(/-cropped$/, '')
            .replace(/[^a-z0-9-_]+/gi, '-')
            .toLowerCase() || 'logo'
        const croppedFile = new File([blob], `${base}-cropped.png`, { type: 'image/png' })

        setShowCropper(false)
        await handleFileSelected(croppedFile, false)
        showToast('Crop applied — this area will become your favicon.', 'success')
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Unable to crop this logo. Please try again.'
        showToast(message, 'error')
      }
    },
    [objectUrl, file, handleFileSelected],
  )

  const cancelCrop = useCallback(() => {
    setShowCropper(false)
  }, [])

  /** Re-opens the cropper for the current logo (e.g. after skipping). */
  const reopenCropper = useCallback(() => {
    if (objectUrl) setShowCropper(true)
  }, [objectUrl])

  const convert = useCallback(async () => {
    if (processingRef.current) return // duplicate-request guard
    if (!file || !objectUrl || !imageInfo) {
      showToast('Please upload a PNG or JPG logo first.', 'error')
      return
    }

    processingRef.current = true
    setError(null)
    setResult(null)

    const apiKey = (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined) ?? ''

    try {
      if (!apiKey) {
        throw new Error('AI is not configured. Please set VITE_OPENROUTER_API_KEY in your .env file.')
      }

      setStage('validating')
      // Give the UI one frame to paint the stage before heavy work.
      await new Promise((r) => setTimeout(r, 30))

      setStage('analyzing')
      const { analysis, analysisImage, originalImage } = await analyzeLogo({ objectUrl, apiKey })

      setStage('composing')
      await new Promise((r) => setTimeout(r, 30))

      setStage('rendering')
      const { masterCanvas, cropRect } = await composeFavicon({
        objectUrl,
        analysis,
        analysisImage,
        originalImage,
        hasTransparency: imageInfo.hasTransparency,
      })
      void cropRect // surfaced later for the selection overlay

      setStage('converting')
      const icoBlob = await generateIcoFromCanvas(masterCanvas)
      const validation = await validateIco(icoBlob)
      if (!validation.valid) {
        throw new Error(
          validation.error ?? 'The generated ICO file failed validation. Please try again.',
        )
      }

      const blob = normalizeIcoBlob(icoBlob)
      const url = URL.createObjectURL(blob)
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
      resultUrlRef.current = url

      const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'favicon'
      const faviconPreview = masterCanvas.toDataURL('image/png')

      // One .ico file per requested size, derived from the master.
      revokeSizeUrls()
      const sizes: FaviconSizeEntry[] = []
      for (const size of DOWNLOAD_SIZES) {
        const sizeIcoBlob = await generateSingleSizeIco(masterCanvas, size)
        const variantUrl = URL.createObjectURL(sizeIcoBlob)
        sizeUrlsRef.current.push(variantUrl)
        sizes.push({
          size,
          blob: sizeIcoBlob,
          url: variantUrl,
          fileName: `${base}-${size}x${size}.ico`,
        })
      }

      setResult({
        previewUrl: faviconPreview,
        icoBlob: blob,
        fileName: `${base}-favicon.ico`,
        size: FAVICON_MASTER_SIZE,
        sizes,
        explanation: analysis.reason,
      })
      setPreviewUrl(faviconPreview)
      setStage('done')
    } catch (err: unknown) {
      setStage('error')
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Unable to analyze this logo. Please try another PNG or JPG.'
      setError(message)
      showToast(message, 'error')
    } finally {
      processingRef.current = false
    }
  }, [file, objectUrl, imageInfo])

  /**
   * Downloads a generated file. Pass a size entry for one of the PNG
   * variants, or call with no argument for the multi-resolution .ico.
   */
  const download = useCallback(
    (entry?: FaviconSizeEntry | null) => {
      const a = document.createElement('a')
      if (entry) {
        a.href = entry.url
        a.download = entry.fileName
      } else {
        if (!result) return
        a.href = resultUrlRef.current ?? URL.createObjectURL(result.icoBlob)
        a.download = result.fileName
      }
      document.body.appendChild(a)
      a.click()
      a.remove()
    },
    [result],
  )

  /**
   * Bundles every generated size (PNGs) plus the multi-resolution .ico
   * into a single ZIP archive and triggers the download.
   */
  const downloadAll = useCallback(async () => {
    if (!result) return
    try {
      const zip = await createZip([
        ...result.sizes.map((s) => ({ name: s.fileName, blob: s.blob })),
        { name: result.fileName, blob: result.icoBlob },
      ])
      const zipName = `${result.fileName.replace(/-favicon\.ico$/, '') || 'favicon'}-favicons.zip`
      const url = URL.createObjectURL(zip)
      const a = document.createElement('a')
      a.href = url
      a.download = zipName
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Give the browser a moment to start the download before revoking.
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      showToast('Unable to bundle the files into a ZIP. Please try again.', 'error')
    }
  }, [result])

  return {
    file,
    objectUrl,
    imageInfo,
    stage,
    stageText: stageMessage(stage),
    error,
    result,
    previewUrl,
    showCropper,
    isProcessing:
      stage === 'validating' || stage === 'analyzing' || stage === 'composing' || stage === 'rendering' || stage === 'converting',
    handleFileSelected,
    applyCrop,
    cancelCrop,
    reopenCropper,
    convert,
    download,
    downloadAll,
    reset,
  }
}
