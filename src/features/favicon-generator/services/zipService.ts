/**
 * Minimal ZIP container writer for the favicon generator.
 *
 * Implements the "store" method (no compression) — every payload here is a
 * PNG or ICO, which are already compressed, so storing keeps the writer tiny
 * and dependency-free while producing a standards-compliant archive
 * (PKWARE APPNOTE.TXT: local headers → central directory → EOCD).
 *
 * Only pure DataView/Uint8Array is used, mirroring icoGeneratorService.
 */

/** CRC-32 (IEEE 802.3, reflected, poly 0xEDB88320) lookup table. */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

/** CRC-32 (IEEE 802.3, reflected, poly 0xEDB88320) — exported for validation. */
export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

/** DOS date/time used by ZIP headers (local time, 2-second granularity). */
function dosDateTime(now: Date): { time: number; date: number } {
  const time =
    (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)
  const date =
    ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()
  return { time, date }
}

export interface ZipEntry {
  name: string
  blob: Blob
}

/**
 * Bundles the given entries into a single .zip Blob.
 * Entry names must be unique; UTF-8 flag is set for non-ASCII names.
 */
export async function createZip(entries: ZipEntry[]): Promise<Blob> {
  if (entries.length === 0) throw new Error('Cannot create an empty ZIP archive.')

  const encoder = new TextEncoder()
  const { time, date } = dosDateTime(new Date())

  // First pass: decode payloads and CRC so the total size is known upfront.
  const prepared = await Promise.all(
    entries.map(async (entry) => {
      const nameBytes = encoder.encode(entry.name)
      const data = new Uint8Array(await entry.blob.arrayBuffer())
      return { nameBytes, data, crc: crc32(data) }
    }),
  )

  let localsSize = 0
  let centralSize = 0
  for (const p of prepared) {
    localsSize += 30 + p.nameBytes.length + p.data.length
    centralSize += 46 + p.nameBytes.length
  }
  const total = localsSize + centralSize + 22

  const buffer = new ArrayBuffer(total)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  let offset = 0
  let centralOffset = localsSize

  prepared.forEach((p) => {
    const nameLen = p.nameBytes.length

    // --- Local file header + payload ---
    view.setUint32(offset, 0x04034b50, true) // local file header signature
    view.setUint16(offset + 4, 20, true) // version needed to extract
    view.setUint16(offset + 6, 0x0800, true) // flags: UTF-8 file names
    view.setUint16(offset + 8, 0, true) // method: store
    view.setUint16(offset + 10, time, true)
    view.setUint16(offset + 12, date, true)
    view.setUint32(offset + 14, p.crc, true)
    view.setUint32(offset + 18, p.data.length, true) // compressed size
    view.setUint32(offset + 22, p.data.length, true) // uncompressed size
    view.setUint16(offset + 26, nameLen, true)
    view.setUint16(offset + 28, 0, true) // extra field length
    bytes.set(p.nameBytes, offset + 30)
    bytes.set(p.data, offset + 30 + nameLen)

    // --- Central directory entry ---
    const dir = centralOffset
    view.setUint32(dir, 0x02014b50, true) // central header signature
    view.setUint16(dir + 4, 20, true) // version made by
    view.setUint16(dir + 6, 20, true) // version needed
    view.setUint16(dir + 8, 0x0800, true) // flags: UTF-8
    view.setUint16(dir + 10, 0, true) // method: store
    view.setUint16(dir + 12, time, true)
    view.setUint16(dir + 14, date, true)
    view.setUint32(dir + 16, p.crc, true)
    view.setUint32(dir + 20, p.data.length, true)
    view.setUint32(dir + 24, p.data.length, true)
    view.setUint16(dir + 28, nameLen, true)
    view.setUint16(dir + 30, 0, true) // extra length
    view.setUint16(dir + 32, 0, true) // comment length
    view.setUint16(dir + 34, 0, true) // disk number start
    view.setUint16(dir + 36, 0, true) // internal attributes
    view.setUint32(dir + 38, 0, true) // external attributes
    view.setUint32(dir + 42, offset, true) // relative offset of local header
    bytes.set(p.nameBytes, dir + 46)
    centralOffset += 46 + nameLen

    offset += 30 + nameLen + p.data.length
  })

  // --- End of central directory (EOCD) ---
  const eocd = centralOffset
  view.setUint32(eocd, 0x06054b50, true)
  view.setUint16(eocd + 4, 0, true) // disk number
  view.setUint16(eocd + 6, 0, true) // disk with central dir
  view.setUint16(eocd + 8, prepared.length, true) // entries on this disk
  view.setUint16(eocd + 10, prepared.length, true) // total entries
  view.setUint32(eocd + 12, centralSize, true) // central dir size
  view.setUint32(eocd + 16, localsSize, true) // central dir offset
  view.setUint16(eocd + 20, 0, true) // comment length

  return new Blob([buffer], { type: 'application/zip' })
}
