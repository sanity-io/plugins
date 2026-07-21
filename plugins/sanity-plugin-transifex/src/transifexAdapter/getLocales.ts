import type {Adapter, Secrets} from 'sanity-translations-tab'

import {baseTransifexUrl, projOrgSlug, getHeaders} from './helpers'

export const getLocales: Adapter['getLocales'] = async (secrets: Secrets | null) => {
  let locales = []
  if (secrets) {
    const response = await fetch(`${baseTransifexUrl}/projects/${projOrgSlug(secrets)}/languages`, {
      headers: getHeaders(secrets),
    })

    if (!response.ok) {
      throw Error(`Failed to retrieve locales from Transifex. Status: ${response.status}`)
    }

    locales = await response.json().then((res) =>
      res.data.map((lang: Record<string, any>) => ({
        enabled: true,
        description: lang['attributes']['name'],
        localeId: lang['attributes']['code'],
      })),
    )
  }
  return locales
}
