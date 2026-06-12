import {authenticate, getHeaders} from './helpers'
import {Secrets} from 'sanity-translations-tab'
import {Adapter} from 'sanity-translations-tab'

export const getLocales: Adapter['getLocales'] = async (secrets: Secrets | null) => {
  if (!secrets?.project || !secrets?.secret || !secrets?.proxy) {
    return []
  }
  const {project, proxy} = secrets
  const url = `https://api.smartling.com/projects-api/v2/projects/${project}`
  const accessToken = await authenticate(secrets)
  return fetch(proxy, {
    method: 'GET',
    headers: getHeaders(url, accessToken),
  })
    .then((res) => res.json())
    .then((res) => res.response.data.targetLocales)
}
