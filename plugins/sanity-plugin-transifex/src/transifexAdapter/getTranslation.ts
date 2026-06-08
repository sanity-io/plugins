import type {Adapter, Secrets} from 'sanity-translations-tab'

import {baseTransifexUrl, getHeaders} from './helpers'

const pollForFileDownloadLocation = async (
  resourceDownloadUrl: string,
  translationDownloadId: string,
  headers: Record<string, any>,
  retryCount = 0,
  maxRetries = 20,
): Promise<string> => {
  const response = await fetch(`${resourceDownloadUrl}/${translationDownloadId}`, {
    headers: headers,
  })

  if (retryCount >= maxRetries) {
    throw Error(
      `Failed to retrieve download location for translation download ID ${translationDownloadId} after ${maxRetries} retries.`,
    )
  }

  if (response.status === 500) {
    //eslint-disable-next-line no-console -- this is for developer feedback/debugging
    console.info(
      `Transifex plugin message: Received 500 for translation download ID ${translationDownloadId}. Trying to reconnect...`,
    )
    await new Promise((resolve) => setTimeout(resolve, 3000))
    return pollForFileDownloadLocation(
      resourceDownloadUrl,
      translationDownloadId,
      headers,
      retryCount + 1,
      maxRetries,
    )
  } else if (response.redirected) {
    //eslint-disable-next-line no-console -- this is for developer feedback/debugging
    console.info(
      `Transifex plugin message: Received redirect for translation download ID ${translationDownloadId}. Following redirect now for file download.`,
    )
    return response.url
  } else if (response.status === 200) {
    //eslint-disable-next-line no-console -- this is for developer feedback/debugging
    console.info(
      `Transifex plugin message: Requested download location for translation download ID ${translationDownloadId}. Location is still pending, trying again.`,
    )
    await new Promise((resolve) => setTimeout(resolve, 3000))
    return pollForFileDownloadLocation(
      resourceDownloadUrl,
      translationDownloadId,
      headers,
      retryCount + 1,
      maxRetries,
    )
  } else if (response.status === 401 || response.status === 403) {
    throw Error(
      `Failed to retrieve download location for translation download ID ${translationDownloadId}. Status: ${response.status}`,
    )
  }
  console.error(
    `Transifex plugin message: Requested download location for translation download ID ${translationDownloadId} but received error code ${response.status}. Waiting and trying again.`,
  )
  await new Promise((resolve) => setTimeout(resolve, 3000))
  return pollForFileDownloadLocation(
    resourceDownloadUrl,
    translationDownloadId,
    headers,
    retryCount + 1,
    maxRetries,
  )
}

const handleFileDownload = (url: string) => {
  return fetch(url).then((res) => res.text())
}

export const getTranslation: Adapter['getTranslation'] = async (
  taskId: string,
  localeId: string,
  secrets: Secrets | null,
) => {
  if (!secrets) {
    throw Error('Missing Transifex secrets.')
  }

  const resourceDownloadBody = {
    data: {
      attributes: {
        content_encoding: 'text',
      },
      relationships: {
        language: {
          data: {
            id: `l:${localeId}`,
            type: 'languages',
          },
        },
        resource: {
          data: {
            id: taskId,
            type: 'resources',
          },
        },
      },
      type: 'resource_translations_async_downloads',
    },
  }

  const resourceDownloadUrl = `${baseTransifexUrl}/resource_translations_async_downloads`
  const downloadResponse = await fetch(resourceDownloadUrl, {
    headers: getHeaders(secrets),
    method: 'POST',
    body: JSON.stringify(resourceDownloadBody),
  })

  if (!downloadResponse.ok) {
    throw Error(
      `Failed to create translation download request in Transifex. Status: ${downloadResponse.status}`,
    )
  }

  const download = await downloadResponse.json()
  const translationDownloadId = download?.data?.id

  if (!translationDownloadId) {
    throw Error('Failed to create translation download request in Transifex. Missing download id.')
  }

  const headers = getHeaders(secrets)
  const location = await pollForFileDownloadLocation(
    resourceDownloadUrl,
    translationDownloadId,
    headers,
  )
  return handleFileDownload(location)
}
