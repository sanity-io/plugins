import {getVersionFromId, getVersionId, isSanityDocument, isVersionId} from 'sanity'
import {LANGUAGE_FIELD_NAME} from 'sanity-plugin-internationalized-array'

import {API_VERSION} from './constants'
import type {TranslationReference} from './types'

type TranslationLanguageClient = {
  fetch: (query: string, params: Record<string, unknown>) => Promise<unknown>
}

export async function validateTranslationReferenceLanguage(
  item: TranslationReference | undefined,
  context: {
    document?: unknown
    getClient: (options: {apiVersion: string}) => TranslationLanguageClient
  },
  languageField: string,
): Promise<true | string> {
  if (!item?.value?._ref || !item[LANGUAGE_FIELD_NAME]) {
    return true
  }

  const client = context.getClient({apiVersion: API_VERSION})
  const documentId = isSanityDocument(context.document) ? context.document._id : undefined
  const releaseId = documentId && isVersionId(documentId) ? getVersionFromId(documentId) : undefined
  const valueLanguage = await client.fetch(
    releaseId
      ? `coalesce(*[_id == $versionRef][0], *[_id in [$ref, $draftRef]][0]).${languageField}`
      : `*[_id in [$ref, $draftRef]][0].${languageField}`,
    {
      ref: item.value._ref,
      draftRef: `drafts.${item.value._ref}`,
      ...(releaseId ? {versionRef: getVersionId(item.value._ref, releaseId)} : {}),
    },
  )

  if (valueLanguage && valueLanguage === item[LANGUAGE_FIELD_NAME]) {
    return true
  }

  return 'Referenced document does not have the correct language value'
}
