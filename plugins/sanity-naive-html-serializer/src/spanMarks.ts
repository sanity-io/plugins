import {escapeHTML, uriLooksSafe, type PortableTextMarkComponent} from '@portabletext/to-html'
import type {TypedObject} from 'sanity'

/**
 * Attribute that carries an annotation mark definition through HTML.
 * The default link tag only keeps `href`, so references and other fields
 * disappear on the way back to portable text.
 */
const SPAN_MARK_ATTR = 'data-pt-mark'

type MarkRecord = TypedObject & Record<string, unknown>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isMarkRecord(value: unknown): value is MarkRecord {
  return isRecord(value) && typeof value._type === 'string'
}

function stringField(value: TypedObject | undefined, field: string): string {
  if (!isRecord(value)) {
    return ''
  }
  const fieldValue = value[field]
  return typeof fieldValue === 'string' ? fieldValue : ''
}

function encodeMarkPayload(
  value: TypedObject | undefined,
  markKey: string | undefined,
  markType: string,
): string | undefined {
  if (!isMarkRecord(value)) {
    return undefined
  }

  const key = stringField(value, '_key') || markKey
  const type = stringField(value, '_type') || markType
  if (!key || !type) {
    return undefined
  }

  try {
    return encodeURIComponent(JSON.stringify({...value, _key: key, _type: type}))
  } catch {
    return undefined
  }
}

function decodeMarkPayload(encoded: string): MarkRecord | undefined {
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(encoded))
    if (!isMarkRecord(parsed)) {
      return undefined
    }
    if (typeof parsed._key !== 'string' || !parsed._key) {
      return undefined
    }
    return parsed
  } catch {
    return undefined
  }
}

function markPayloadAttribute(encoded: string): string {
  return ` ${SPAN_MARK_ATTR}="${encoded}"`
}

/**
 * Mark keys are not element ids. One definition can wrap several separate
 * anchors, and the block key already uses `id` to find its way back.
 */
export const linkMark: PortableTextMarkComponent = ({children, value, markKey, markType}) => {
  const href = stringField(value, 'href')
  const safeHref = href && uriLooksSafe(href) ? escapeHTML(href) : ''
  const encoded = encodeMarkPayload(value, markKey, markType)
  const payload = encoded ? markPayloadAttribute(encoded) : ''
  return `<a href="${safeHref}"${payload}>${children}</a>`
}

export const unknownAnnotationMark: PortableTextMarkComponent = ({
  children,
  value,
  markKey,
  markType,
}) => {
  const className = `unknown__pt__mark__${escapeHTML(markType)}`
  const encoded = encodeMarkPayload(value, markKey, markType)
  if (!encoded) {
    return `<span class="${className}">${children}</span>`
  }
  return `<span class="${className}"${markPayloadAttribute(encoded)}>${children}</span>`
}

type MarkElement = {
  tagName?: string
  getAttribute?: (name: string) => string | null
  childNodes: NodeList
}

export function deserializeSpanMark(
  el: MarkElement,
  next: (elements: Node | Node[] | NodeList) => TypedObject | TypedObject[] | undefined,
): TypedObject | undefined {
  if (typeof el.tagName !== 'string' || typeof el.getAttribute !== 'function') {
    return undefined
  }

  const tag = el.tagName.toLowerCase()
  if (tag !== 'a' && tag !== 'span') {
    return undefined
  }

  const encoded = el.getAttribute(SPAN_MARK_ATTR)
  if (!encoded) {
    return undefined
  }

  const decoded = decodeMarkPayload(encoded)
  if (!decoded) {
    return undefined
  }

  const markDef = withImportedHref(decoded, el, tag)
  const children = next(el.childNodes)
  return {
    _type: '__annotation',
    markDef,
    children: Array.isArray(children) ? children : children ? [children] : [],
  }
}

/**
 * Translators edit the visible href. When that attribute is non-empty it
 * replaces the payload URL, and the other mark fields stay. An empty href
 * leaves the payload URL in place, except an unsafe one, which is removed
 * so it cannot ride along behind a blank anchor.
 */
function withImportedHref(markDef: MarkRecord, el: MarkElement, tag: string): MarkRecord {
  if (tag === 'a' && el.getAttribute) {
    const attributeHref = el.getAttribute('href')?.trim()
    if (attributeHref) {
      return {...markDef, href: attributeHref}
    }
  }
  return omitUnsafeHref(markDef)
}

function omitUnsafeHref(markDef: MarkRecord): MarkRecord {
  const href = markDef.href
  if (typeof href !== 'string' || href === '' || uriLooksSafe(href)) {
    return markDef
  }
  const next = {...markDef}
  delete next.href
  return next
}

/**
 * The HTML deserializer records one mark definition per element. A repeated
 * annotation is several elements that share a key, so keep the first.
 */
export function dedupeMarkDefs(block: {markDefs?: unknown[] | undefined} | undefined): void {
  if (!block || !Array.isArray(block.markDefs)) {
    return
  }
  const seen = new Set<string>()
  const markDefs = block.markDefs
  block.markDefs = markDefs.filter((def) => {
    if (!isRecord(def) || typeof def._key !== 'string' || def._key.length === 0) {
      return true
    }
    if (seen.has(def._key)) {
      return false
    }
    seen.add(def._key)
    return true
  })
}
