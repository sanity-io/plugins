import {Adapter, Secrets} from 'sanity-translations-tab'
import {baseTransifexUrl, projOrgSlug, getHeaders} from './helpers'

export const getLocales: Adapter['getLocales'] = async (secrets: Secrets | null) => {
  let locales = []
  if (secrets) {
    locales = await fetch(`${baseTransifexUrl}/projects/${projOrgSlug(secrets)}/languages`, {
      headers: getHeaders(secrets),
    })
      .then((res) => res.json())
      .then((res) =>
        res.data.map((lang: Record<string, any>) => ({
          enabled: true,
          description: lang.attributes.name,
          localeId: lang.attributes.code,
        }))
      )
  }
  return locales
}
