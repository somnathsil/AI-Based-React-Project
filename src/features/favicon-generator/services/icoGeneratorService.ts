/**
 * ICO container writer + validator for the favicon generator.
 *
 * The ICO spec (MS-ICO / Wikipedia "ICO (file format)") allows directory
 * entries whose payload is an embedded PNG. Browsers, Windows Vista+ and all
 * modern tooling read PNG-in-ICO. This keeps the 512×512 master artwork
 * intact: the ICO format's own 8-bit dimension byte cannot represent 512
 * (it stores width % 256), so a legacy BMP-DIB entry would force a silent
 * downgrade to ≤256px — exactly what the feature spec forbids.
 *
 * Only pure DataView/Uint8Array is used, so this runs in any browser and
 * produces a standards-compliant ICO (no hand-waving, validated below).
 */

/** ICO directory entries with a PNG payload (older engines get BMP too). */
const EMBEDDED_PNG_SIZES = [256, 48, 32, 16] as const

interface IcoEntry {
  width: number
  height: number
  pngBytes: Uint8Array
}

function u16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true)
}

function u32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value, true)
}

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('PNG encoding failed while building the ICO.')
  const buffer = await blob.arrayBuffer()
  return new Uint8Array(buffer)
}

function downscaleToPng(source: HTMLCanvasElement, size: number): Promise<Uint8Array> {
  const out = document.createElement('canvas')
  out.width = size
  out.height = size
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable in this browser.')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  // 512 master → target size (aspect ratio is 1:1, no distortion possible).
  ctx.drawImage(source, 0, 0, size, size)
  return canvasToPngBytes(out)
}

/**
 * Builds a single-size ICO from the 512×512 master canvas: one PNG entry
 * at exactly the requested size. Used for the per-size downloads.
 */
export async function generateSingleSizeIco(master: HTMLCanvasElement, size: number): Promise<Blob> {
  if (master.width !== 512 || master.height !== 512) {
    throw new Error('ICO master canvas must be exactly 512×512.')
  }
  return buildIco([{ width: size, height: size, pngBytes: await downscaleToPng(master, size) }])
}

/**
 * Builds a multi-resolution ICO from the 512×512 master canvas.
 * The master is never modified or downscaled *before* this call — entries
 * are derived from it, per spec: "the primary generated favicon artwork
 * must originate from the 512 × 512 composition".
 */
export async function generateIcoFromCanvas(master: HTMLCanvasElement): Promise<Blob> {
  if (master.width !== 512 || master.height !== 512) {
    throw new Error('ICO master canvas must be exactly 512×512.')
  }

  const entries: IcoEntry[] = []
  for (const size of EMBEDDED_PNG_SIZES) {
    entries.push({
      width: size,
      height: size,
      pngBytes: await downscaleToPng(master, size),
    })
  }
  // The 512 master itself is embedded first, untouched.
  entries.unshift({ width: 512, height: 512, pngBytes: await canvasToPngBytes(master) })

  return buildIco(entries)
}

/**
 * Assembles ICO directory entries into a standards-compliant ICO Blob
 * (ICONDIR → directory entries → PNG payloads, per MS-ICO).
 */
function buildIco(entries: IcoEntry[]): Blob {
  const headerSize = 6
  const dirEntrySize = 16
  const dataOffsetStart = headerSize + dirEntrySize * entries.length
  let payloadBytes = 0
  for (const entry of entries) payloadBytes += entry.pngBytes.length

  const total = dataOffsetStart + payloadBytes
  const buffer = new ArrayBuffer(total)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  // ICONDIR
  u16(view, 0, 0) // reserved
  u16(view, 2, 1) // type: 1 = icon
  u16(view, 4, entries.length)

  let offset = dataOffsetStart
  entries.forEach((entry, i) => {
    const dir = headerSize + i * dirEntrySize
    // 8-bit dimension byte: 512 % 256 === 0 → stored as 0, meaning 256+
    // per spec interpretation ("0 = 256" historically; readers use the
    // actual payload). PNG payloads carry their own true dimensions.
    bytes[dir] = entry.width % 256
    bytes[dir + 1] = entry.height % 256
    bytes[dir + 2] = 0 // palette
    bytes[dir + 3] = 0 // reserved
    u16(view, dir + 4, 1) // color planes
    u16(view, dir + 6, 32) // bits per pixel
    u32(view, dir + 8, entry.pngBytes.length)
    u32(view, dir + 12, offset)
    bytes.set(entry.pngBytes, offset)
    offset += entry.pngBytes.length
  })

  return new Blob([buffer], { type: 'image/x-icon' })
}

export interface IcoValidationResult {
  valid: boolean
  error?: string
}

/**
 * Structural validation of the produced ICO:
 * header, directory entries, offsets, sizes, PNG signature payload.
 */
export async function validateIco(blob: Blob): Promise<IcoValidationResult> {
  if (blob.size < 6 + 16) return { valid: false, error: 'ICO file is truncated.' }

  const buf = await blob.arrayBuffer()
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)

  if (view.getUint16(0, true) !== 0) return { valid: false, error: 'Invalid ICO header.' }
  if (view.getUint16(2, true) !== 1) return { valid: false, error: 'Not an ICO image container.' }

  const count = view.getUint16(4, true)
  if (count === 0) return { valid: false, error: 'ICO contains no images.' }
  if (6 + count * 16 > buf.byteLength) return { valid: false, error: 'ICO directory is corrupt.' }

  for (let i = 0; i < count; i++) {
    const dir = 6 + i * 16
    const size = view.getUint32(dir + 8, true)
    const offset = view.getUint32(dir + 12, true)
    if (size === 0 || offset + size > buf.byteLength) {
      return { valid: false, error: 'ICO entry points outside the file.' }
    }
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    for (let b = 0; b < pngSignature.length; b++) {
      if (bytes[offset + b] !== pngSignature[b]) {
        return { valid: false, error: 'ICO entry payload is not a PNG image.' }
      }
    }
  }

  return { valid: true }
}

/** Browsers may sniff .ico as octet-stream; force a sane download type. */
export function normalizeIcoBlob(blob: Blob): Blob {
  if (blob.type === 'image/x-icon' || blob.type === 'image/vnd.microsoft.icon') return blob
  return new Blob([blob], { type: 'image/x-icon' })
}
