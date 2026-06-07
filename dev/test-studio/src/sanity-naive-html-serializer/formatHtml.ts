const VOID_ELEMENTS = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i

/**
 * Pretty-print serialized HTML for display in the studio preview.
 * The serializer returns `outerHTML`, which is typically minified on one line.
 */
export function formatHtml(html: string): string {
  const indentUnit = '  '
  const lines = html.replace(/>\s+</g, '><').replace(/></g, '>\n<').trim().split('\n')

  let indent = 0
  const formatted: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const tagMatch = line.match(/^<\/?([a-zA-Z0-9-]+)/)
    const tagName = tagMatch?.[1]
    const isClosingTag = line.startsWith('</')
    const isSelfClosing =
      line.endsWith('/>') || (tagName !== undefined && VOID_ELEMENTS.test(tagName))
    const opensAndClosesOnSameLine =
      !isClosingTag && !isSelfClosing && /<\/[^>]+>$/.test(line) && line.indexOf('</') > 0

    if (isClosingTag) {
      indent = Math.max(0, indent - 1)
    }

    formatted.push(`${indentUnit.repeat(indent)}${line}`)

    if (!isClosingTag && !isSelfClosing && !opensAndClosesOnSameLine && tagName) {
      indent += 1
    }
  }

  return formatted.join('\n')
}
