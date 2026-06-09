import type {Adapter, Secrets} from 'sanity-translations-tab'

import {getTranslationTask} from './getTranslationTask'
import {baseTransifexUrl, projOrgSlug, getHeaders} from './helpers'

const createResource = async (
  doc: Record<string, any>,
  documentId: string,
  secrets: Secrets | null,
) => {
  const resourceCreateBody = {
    data: {
      attributes: {
        accept_translations: true,
        name: doc['name'],
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

  const response = await fetch(`${baseTransifexUrl}/resources`, {
    headers: getHeaders(secrets),
    method: 'POST',
    body: JSON.stringify(resourceCreateBody),
  })

  if (!response.ok) {
    throw Error(`Failed to create Transifex resource. Status: ${response.status}`)
  }

  const res = await response.json()
  const resourceId = res?.data?.id

  if (!resourceId) {
    throw Error('Failed to create Transifex resource. Missing resource id in response.')
  }

  return resourceId
}

export const createTask: Adapter['createTask'] = async (
  documentId: string,
  document: Record<string, any>,
  _localeIds: string[],
  secrets: Secrets | null,
) => {
  if (!documentId || !secrets) {
    throw Error('Missing documentId or Transifex secrets.')
  }

  const resourceResponse = await fetch(
    `${baseTransifexUrl}/resources/${projOrgSlug(secrets)}:r:${documentId}`,
    {headers: getHeaders(secrets)},
  )
  let resourceId: string | null = null

  if (resourceResponse.status === 404) {
    resourceId = null
  } else if (!resourceResponse.ok) {
    throw Error(`Failed to retrieve Transifex resource. Status: ${resourceResponse.status}`)
  } else {
    const resource = await resourceResponse.json()
    resourceId = resource.data ? resource.data.id : null
  }

  if (!resourceId) {
    resourceId = await createResource(document, documentId, secrets)
  }

  const resourceUploadUrl = `${baseTransifexUrl}/resource_strings_async_uploads`
  const resourceUploadBody = {
    data: {
      attributes: {
        content: document['content'],
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

  const uploadResponse = await fetch(resourceUploadUrl, {
    method: 'POST',
    body: JSON.stringify(resourceUploadBody),
    headers: getHeaders(secrets),
  })

  if (!uploadResponse.ok) {
    throw Error(`Failed to upload resource strings to Transifex. Status: ${uploadResponse.status}`)
  }

  return getTranslationTask(documentId, secrets)
}
