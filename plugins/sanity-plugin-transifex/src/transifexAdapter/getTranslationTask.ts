import {Adapter, Secrets} from 'sanity-translations-tab'
import {baseTransifexUrl, projOrgSlug, getHeaders} from './helpers'
import {getLocales} from './getLocales'

export const getTranslationTask: Adapter['getTranslationTask'] = async (
  documentId: string,
  secrets: Secrets | null
) => {
  if (!documentId || !secrets) {
    return {
      taskId: documentId,
      documentId: documentId,
      locales: [],
    }
  }
  const projectFilter = `filter[project]=${projOrgSlug(secrets)}`
  const resourceFilter = `filter[resource]=${projOrgSlug(secrets)}:r:${documentId}`
  const task = await fetch(
    `${baseTransifexUrl}/resource_language_stats?${projectFilter}&${resourceFilter}`,
    {headers: getHeaders(secrets)}
  )
    .then((res) => {
      if (res.ok) {
        return res.json()
      }
      //normal -- just means that this task doesn't exist yet.
      else if (res.status === 404) {
        return {data: []}
      }
      throw Error(`Failed to retrieve tasks from Transifex. Status: ${res.status}`)
    })
    .then((res) => ({
      taskId: `${projOrgSlug(secrets)}:r:${documentId}`,
      documentId: documentId,
      locales: res.data.map((locale: Record<string, any>) => ({
        localeId: locale.relationships.language.data.id.split(':')[1],
        progress: Math.floor(
          100 * (locale.attributes.reviewed_strings / parseFloat(locale.attributes.total_strings))
        ),
      })),
    }))

  const locales = await getLocales(secrets)
  const localeIds = locales.map((l: Record<string, any>) => l.localeId)
  const validLocales = task.locales.filter((locale: Record<string, any>) =>
    localeIds.find((id: string) => id === locale.localeId)
  )
  task.locales = validLocales

  return task
}
