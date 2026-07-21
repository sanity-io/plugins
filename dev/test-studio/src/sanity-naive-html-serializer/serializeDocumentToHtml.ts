import type {Schema, SanityDocument} from 'sanity'
import {BaseDocumentSerializer} from 'sanity-naive-html-serializer'

export function serializeDocumentToHtml(schema: Schema, doc: SanityDocument) {
  return BaseDocumentSerializer(schema).serializeDocument(doc, 'document')
}
