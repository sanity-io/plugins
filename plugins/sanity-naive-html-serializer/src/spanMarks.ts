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

function markAttributes(encoded: string | undefined, id: string | undefined): string {
  const idAttr = id ? ` id="${escapeHTML(id)}"` : ''
  const payloadAttr = encoded ? ` ${SPAN_MARK_ATTR}="${encoded}"` : ''
  return `${idAttr}${payloadAttr}`
}

export const linkMark: PortableTextMarkComponent = ({children, value, markKey, markType}) => {
  const href = stringField(value, 'href')
  const safeHref = href && uriLooksSafe(href) ? escapeHTML(href) : ''
  const encoded = encodeMarkPayload(value, markKey, markType)
  const id = stringField(value, '_key') || markKey
  return `<a href="${safeHref}"${markAttributes(encoded, id)}>${children}</a>`
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
  const id = stringField(value, '_key') || markKey
  return `<span class="${className}"${markAttributes(encoded, id)}>${children}</span>`
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

  const markDef = decodeMarkPayload(encoded)
  if (!markDef) {
    return undefined
  }

  const children = next(el.childNodes)
  return {
    _type: '__annotation',
    markDef,
    children: Array.isArray(children) ? children : children ? [children] : [],
  }
}
