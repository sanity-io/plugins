import {Adapter, Secrets} from 'sanity-translations-tab'
import {baseTransifexUrl, projOrgSlug, getHeaders} from './helpers'
import {getTranslationTask} from './getTranslationTask'

const createResource = (doc: Record<string, any>, documentId: string, secrets: Secrets | null) => {
  const resourceCreateBody = {
    data: {
      attributes: {
        accept_translations: true,
        name: doc.name,
        slug: documentId,
      },
      relationships: {
        i18n_format: {
          data: {
            id: 'HTML_FRAGMENT',
            type: 'i18n_formats',
          },
        },
        project: {
          data: {
            id: projOrgSlug(secrets),
            type: 'projects',
          },
        },
      },
      type: 'resources',
    },
  }

  return fetch(`${baseTransifexUrl}/resources`, {
    headers: getHeaders(secrets),
    method: 'POST',
    body: JSON.stringify(resourceCreateBody),
  })
    .then((res) => res.json())
    .then((res) => res.data.id)
}

//@ts-ignore until we resolve the TranslationTask return type
export const createTask: Adapter['createTask'] = async (
  documentId: string,
  document: Record<string, any>,
  localeIds: string[],
  secrets: Secrets | null
) => {
  let resourceId = await fetch(
    `${baseTransifexUrl}/resources/${projOrgSlug(secrets)}:r:${documentId}`,
    {headers: getHeaders(secrets)}
  )
    .then((res) => res.json())
    .then((res) => (res.data ? res.data.id : null))

  if (!resourceId) {
    resourceId = await createResource(document, documentId, secrets)
  }

  const resourceUploadUrl = `${baseTransifexUrl}/resource_strings_async_uploads`
  const resourceUploadBody = {
    data: {
      attributes: {
        content: document.content,
        content_encoding: 'text',
      },
      relationships: {
        resource: {
          data: {
            id: resourceId,
            type: 'resources',
          },
        },
      },
      type: 'resource_strings_async_uploads',
    },
  }

  return fetch(resourceUploadUrl, {
    method: 'POST',
    body: JSON.stringify(resourceUploadBody),
    headers: getHeaders(secrets),
  }).then(() => getTranslationTask(documentId, secrets))
}
