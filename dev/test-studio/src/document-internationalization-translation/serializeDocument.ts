import type {SanityDocument, Schema} from 'sanity'
import {BaseDocumentSerializer} from 'sanity-translations-tab'

/*
 * Serializes a document at the `document` translation level — the payload
 * `baseDocumentLevelConfig` sends to a translation vendor.
 */
export function serializeDocumentForTranslation(
  schema: Schema,
  doc: SanityDocument,
  baseLanguage: string,
) {
  return BaseDocumentSerializer(schema).serializeDocument(doc, 'document', baseLanguage)
}
