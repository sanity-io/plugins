import type {SanityDocument} from 'sanity'

import {METADATA_SCHEMA_NAME} from '../../constants'

/**
 * Splits an array of referring documents into two groups: translation metadata
 * documents (whose `_type` matches the metadata schema name) and all other
 * references. Used by the delete-translation dialog to show which metadata
 * entries will be patched versus which external references may block deletion.
 */
export function separateReferences(data: SanityDocument[] | null = []): {
  translations: SanityDocument[]
  otherReferences: SanityDocument[]
} {
  const translations: SanityDocument[] = []
  const otherReferences: SanityDocument[] = []

  if (data && data.length > 0) {
    data.forEach((doc) => {
      if (doc._type === METADATA_SCHEMA_NAME) {
        translations.push(doc)
      } else {
        otherReferences.push(doc)
      }
    })
  }

  return {translations, otherReferences}
}
