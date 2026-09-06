/**
 * SVG Style Processor
 *
 * Transforms SVGs to match the user's preferred style:
 * - "fill": All paths use fill="currentColor", no strokes
 * - "stroke": All paths use fill="none" stroke="currentColor" with stroke-width
 */

export type StyleMode = 'fill' | 'stroke'

/**
 * Transform an SVG string to match the desired style.
 * Ensures all path/shape elements use fill="currentColor" or stroke="currentColor".
 */
export function applyStyleToSvg(svg: string, style: StyleMode): string {
  if (!svg || !svg.includes('<svg')) return svg

  let result = svg

  if (style === 'fill') {
    result = applyFillStyle(result)
  } else {
    result = applyStrokeStyle(result)
  }

  return result
}

function applyFillStyle(svg: string): string {
  let result = svg

  // Set the root SVG to have no stroke by default
  result = result.replace(
    /<svg([^>]*)>/i,
    (_, attrs: string) => {
      // Remove stroke from root svg if present
      let cleanAttrs = attrs.replace(/\s*stroke="[^"]*"/gi, '')
      // Add fill="currentColor" if not present
      if (!/fill\s*=/.test(cleanAttrs)) {
        cleanAttrs += ' fill="currentColor"'
      }
      return `<svg${cleanAttrs}>`
    },
  )

  // Transform all path, circle, rect, ellipse, polygon, polyline elements
  result = result.replace(
    /<(path|circle|rect|ellipse|polygon|polyline|line)([^>]*?)(\/?)>/gi,
    (match: string, tag: string, attrs: string, selfClose: string) => {
      let newAttrs = attrs

      // Remove existing stroke attributes
      newAttrs = newAttrs.replace(/\s*stroke="[^"]*"/gi, '')
      newAttrs = newAttrs.replace(/\s*stroke-width="[^"]*"/gi, '')
      newAttrs = newAttrs.replace(/\s*stroke-linecap="[^"]*"/gi, '')
      newAttrs = newAttrs.replace(/\s*stroke-linejoin="[^"]*"/gi, '')
      newAttrs = newAttrs.replace(/\s*stroke-dasharray="[^"]*"/gi, '')

      // Set fill to currentColor
      if (/fill\s*=\s*"none"/i.test(newAttrs)) {
        newAttrs = newAttrs.replace(/fill\s*=\s*"none"/gi, 'fill="currentColor"')
      } else if (!/fill\s*=/.test(newAttrs)) {
        newAttrs += ' fill="currentColor"'
      }

      return `<${tag}${newAttrs}${selfClose}>`
    },
  )

  // Handle <g> elements - set color
  result = result.replace(
    /<g([^>]*)>/gi,
    (match: string, attrs: string) => {
      let newAttrs = attrs
      if (!/color\s*=/.test(newAttrs) && !/fill\s*=/.test(newAttrs)) {
        // Don't add fill to g elements, let children handle it
      }
      return `<g${newAttrs}>`
    },
  )

  return result
}

function applyStrokeStyle(svg: string): string {
  let result = svg

  // Set the root SVG defaults
  result = result.replace(
    /<svg([^>]*)>/i,
    (_, attrs: string) => {
      let cleanAttrs = attrs
      // Remove fill from root if it's a specific color (not currentColor)
      cleanAttrs = cleanAttrs.replace(/\s*fill="(?!currentColor)[^"]*"/gi, '')
      if (!/fill\s*=/.test(cleanAttrs)) {
        cleanAttrs += ' fill="none"'
      }
      if (!/stroke\s*=/.test(cleanAttrs)) {
        cleanAttrs += ' stroke="currentColor"'
      }
      if (!/stroke-width\s*=/.test(cleanAttrs)) {
        cleanAttrs += ' stroke-width="2"'
      }
      if (!/stroke-linecap\s*=/.test(cleanAttrs)) {
        cleanAttrs += ' stroke-linecap="round"'
      }
      if (!/stroke-linejoin\s*=/.test(cleanAttrs)) {
        cleanAttrs += ' stroke-linejoin="round"'
      }
      return `<svg${cleanAttrs}>`
    },
  )

  // Transform all path, circle, rect, ellipse, polygon, polyline, line elements
  result = result.replace(
    /<(path|circle|rect|ellipse|polygon|polyline|line)([^>]*?)(\/?)>/gi,
    (match: string, tag: string, attrs: string, selfClose: string) => {
      let newAttrs = attrs

      // Set fill to none
      if (/fill\s*=/.test(newAttrs)) {
        newAttrs = newAttrs.replace(/fill\s*=\s*"[^"]*"/gi, 'fill="none"')
      } else {
        newAttrs += ' fill="none"'
      }

      // Set stroke to currentColor
      if (/stroke\s*=/.test(newAttrs)) {
        newAttrs = newAttrs.replace(/stroke\s*=\s*"[^"]*"/gi, 'stroke="currentColor"')
      } else {
        newAttrs += ' stroke="currentColor"'
      }

      // Ensure stroke-width
      if (!/stroke-width\s*=/.test(newAttrs)) {
        newAttrs += ' stroke-width="2"'
      }

      // Ensure stroke-linecap
      if (!/stroke-linecap\s*=/.test(newAttrs)) {
        newAttrs += ' stroke-linecap="round"'
      }

      // Ensure stroke-linejoin
      if (!/stroke-linejoin\s*=/.test(newAttrs)) {
        newAttrs += ' stroke-linejoin="round"'
      }

      return `<${tag}${newAttrs}${selfClose}>`
    },
  )

  return result
}
