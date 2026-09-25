import groq from 'groq'

import type {OrderDirection} from '../types'

// Order fields that are stored as a localized object (e.g. `{en: '...', nb: '...'}`)
// when the plugin's `locales` option is configured, rather than a plain string.
const LOCALIZED_ORDER_FIELDS = new Set(['title'])

const ORDER_DICTIONARY: Record<string, {asc: string; desc: string}> = {
  _createdAt: {
    asc: 'Last created: Oldest first',
    desc: 'Last created: Newest first',
  },
  _updatedAt: {
    asc: 'Last updated: Oldest first',
    desc: 'Last updated: Newest first',
  },
  mimeType: {
    asc: 'MIME type: A to Z',
    desc: 'MIME type: Z to A',
  },
  originalFilename: {
    asc: 'File name: A to Z',
    desc: 'File name: Z to A',
  },
  title: {
    asc: 'Title: A to Z',
    desc: 'Title: Z to A',
  },
  size: {
    asc: 'File size: Smallest first',
    desc: 'File size: Largest first',
  },
}

export const getOrderTitle = (field: string, direction: OrderDirection): string => {
  return ORDER_DICTIONARY[field]![direction]
}

/**
 * GROQ expression to sort by `field`. For fields that are stored as a localized object when
 * `locales` are configured, this coalesces through the configured locales (in the order they're
 * declared, matching the fallback pattern documented in the README) so `order()` sorts by the
 * first available translation instead of comparing the object itself. With no `localeIds` (the
 * non-localized default), the field is returned as-is.
 */
export const getOrderField = (field: string, localeIds: string[]): string => {
  if (localeIds.length === 0 || !LOCALIZED_ORDER_FIELDS.has(field)) {
    return field
  }

  const localizedFieldAccessors = localeIds.map(
    (localeId) => groq`${field}[${JSON.stringify(localeId)}]`,
  )

  return groq`coalesce(${localizedFieldAccessors.join(', ')})`
}
