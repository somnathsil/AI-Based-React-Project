const BLOCKED_TAGS = [
  'script', 'iframe', 'foreignObject', 'object', 'embed', 'applet',
  'form', 'input', 'textarea', 'select', 'button',
]

const BLOCKED_ATTRS = [
  'onload', 'onclick', 'onerror', 'onmouseover', 'onmouseout',
  'onfocus', 'onblur', 'onsubmit', 'onreset',
]

const UNSAFE_URL_PATTERNS = [
  /javascript:/i,
  /data:image\//i,
  /vbscript:/i,
  /file:/i,
]

export interface SvgValidationResult {
  isValid: boolean
  svg: string
  errors: string[]
}

export function validateSvg(svgString: string): SvgValidationResult {
  const errors: string[] = []
  let cleaned = svgString.trim()

  // Extract SVG content if wrapped in explanation text
  const svgMatch = cleaned.match(/<svg[\s\S]*?<\/svg>/i)
  if (svgMatch) {
    cleaned = svgMatch[0]
  }

  // Check for SVG root element
  if (!cleaned.toLowerCase().startsWith('<svg')) {
    errors.push('Missing SVG root element')
    return { isValid: false, svg: cleaned, errors }
  }

  // Check for closing SVG tag
  if (!cleaned.toLowerCase().includes('</svg>')) {
    errors.push('Missing closing SVG tag')
    return { isValid: false, svg: cleaned, errors }
  }

  // Check for blocked tags
  for (const tag of BLOCKED_TAGS) {
    const regex = new RegExp(`<${tag}[\\s>]`, 'i')
    if (regex.test(cleaned)) {
      errors.push(`Blocked tag found: <${tag}>`)
    }
  }

  // Check for blocked attributes
  for (const attr of BLOCKED_ATTRS) {
    if (cleaned.toLowerCase().includes(attr)) {
      errors.push(`Blocked attribute found: ${attr}`)
    }
  }

  // Check for unsafe URLs
  for (const pattern of UNSAFE_URL_PATTERNS) {
    if (pattern.test(cleaned)) {
      errors.push(`Unsafe URL pattern detected`)
    }
  }

  // Check for viewBox
  if (!/viewBox\s*=/i.test(cleaned)) {
    errors.push('Missing viewBox attribute')
  }

  // Check for base64 encoded content
  if (/base64/i.test(cleaned)) {
    errors.push('Base64 content detected')
  }

  // Check for external URLs (href/xlink:href to http)
  const externalUrlRegex = /(href|xlink:href)\s*=\s*["']https?:\/\//i
  if (externalUrlRegex.test(cleaned)) {
    errors.push('External URL detected')
  }

  if (errors.length > 0) {
    return { isValid: false, svg: cleaned, errors }
  }

  return { isValid: true, svg: cleaned, errors: [] }
}

export function sanitizeSvg(svgString: string): string {
  let cleaned = svgString.trim()

  // Extract SVG if embedded in text
  const svgMatch = cleaned.match(/<svg[\s\S]*?<\/svg>/i)
  if (svgMatch) {
    cleaned = svgMatch[0]
  }

  // Remove script tags
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '')

  // Remove event handlers
  for (const attr of BLOCKED_ATTRS) {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi')
    cleaned = cleaned.replace(regex, '')
  }

  // Remove dangerous tags
  for (const tag of BLOCKED_TAGS) {
    const regex = new RegExp(`<${tag}[\\s\\S]*?\\/?>[\\s\\S]*?<\\/${tag}>`, 'gi')
    cleaned = cleaned.replace(regex, '')
    const selfClosingRegex = new RegExp(`<${tag}[\\s\\S]*?\\/?>`, 'gi')
    cleaned = cleaned.replace(selfClosingRegex, '')
  }

  // Remove style tags with suspicious content
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '')

  return cleaned.trim()
}

export function ensureViewBox(svgString: string, width = 24, height = 24): string {
  if (/viewBox\s*=/i.test(svgString)) {
    return svgString
  }
  return svgString.replace(
    /<svg/,
    `<svg viewBox="0 0 ${width} ${height}"`
  )
}

export function extractTitle(svgString: string): string {
  const titleMatch = svgString.match(/<title[^>]*>([^<]*)<\/title>/i)
  return titleMatch ? titleMatch[1].trim() : 'Generated Icon'
}

export function generateFilename(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'icon'
}
