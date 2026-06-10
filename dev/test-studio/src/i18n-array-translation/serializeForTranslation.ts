import type {SanityDocument, Schema} from 'sanity'
import {BaseDocumentSerializer} from 'sanity-translations-tab'

/*
 * Serializes a document at the `internationalizedArray` translation level — the same
 * payload that `baseI18nArrayConfig` sends to a translation vendor.
 */
export function serializeForTranslation(schema: Schema, doc: SanityDocument, baseLanguage: string) {
  return BaseDocumentSerializer(schema).serializeDocument(
    doc,
    'internationalizedArray',
    baseLanguage,
  )
}
