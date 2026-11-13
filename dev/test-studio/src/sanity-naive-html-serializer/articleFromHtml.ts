import {BaseDocumentDeserializer} from 'sanity-naive-html-serializer'

const ARTICLE_TYPE = 'naiveHtmlSerializerArticle'

export type ArticleImport = {
  title?: string
  snippet?: string
  content?: unknown[]
}

export type ArticleImportResult = {ok: true; fields: ArticleImport} | {ok: false; message: string}

/**
 * Read a serialized article back into the fields this test document stores.
 * Document id, revision, and type from the HTML are left untouched so the paste
 * applies to the article that is open.
 */
export function articleFromHtml(html: string): ArticleImportResult {
  const trimmed = html.trim()
  if (!trimmed) {
    return {ok: false, message: 'Paste the serialized HTML first.'}
  }

  let deserialized: Record<string, unknown>
  try {
    deserialized = BaseDocumentDeserializer.deserializeDocument(trimmed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read this HTML.'
    return {ok: false, message}
  }

  if (typeof deserialized._type === 'string' && deserialized._type !== ARTICLE_TYPE) {
    return {
      ok: false,
      message: `This HTML is a "${deserialized._type}" document. Paste HTML from an HTML Serializer Article.`,
    }
  }

  const fields: ArticleImport = {}
  if (typeof deserialized.title === 'string') {
    fields.title = deserialized.title
  }
  if (typeof deserialized.snippet === 'string') {
    fields.snippet = deserialized.snippet
  }
  if (Array.isArray(deserialized.content)) {
    fields.content = deserialized.content.filter((block) => block && typeof block === 'object')
  }

  if (fields.title === undefined && fields.snippet === undefined && fields.content === undefined) {
    return {ok: false, message: 'This HTML did not include a title, snippet, or content.'}
  }

  return {ok: true, fields}
}
