import type {Secrets} from 'sanity-translations-tab'

export const authenticate = (secrets: Secrets): Promise<string> => {
  const url = 'https://api.smartling.com/auth-api/v2/authenticate'
  const headers = {
    'content-type': 'application/json',
    'X-URL': url,
  }
  const {secret, proxy} = secrets
  if (!secret || !proxy) {
    throw new Error(
      'The Smartling adapter requires a secret key and a proxy URL. Please check your secrets document in this dataset, per the plugin documentation.',
    )
  }
  // `secret` is already a JSON string (e.g. `{"userIdentifier":"…","userSecret":"…"}`),
  // so it is sent as-is. Wrapping it in `JSON.stringify` would double-encode it into a
  // quoted string and break authentication with proxies that forward the body verbatim.
  return fetch(proxy, {
    headers,
    method: 'POST',
    body: secret,
  })
    .then((res) => res.json())
    .then((res) => {
      const accessToken = res?.response?.data?.accessToken
      if (!accessToken) {
        const errMsg =
          res?.response?.errors?.[0]?.message ||
          'Could not authenticate with Smartling. Please check your secret key and proxy URL, per the plugin documentation.'
        throw new Error(errMsg)
      }
      return accessToken
    })
}

export const getHeaders = (url: string, accessToken: string): Record<string, string> => ({
  'Authorization': `Bearer ${accessToken}`,
  'X-URL': url,
})

export const findExistingJob = async (
  documentId: string,
  secrets: Secrets,
  accessToken: string,
): Promise<string> => {
  const {project, proxy} = secrets
  if (!project || !proxy) {
    throw new Error(
      'The Smartling adapter requires a Smartling project identifier and a proxy URL. Please check your secrets document in this dataset, per the plugin documentation.',
    )
  }
  const url = `https://api.smartling.com/jobs-api/v3/projects/${project}/jobs?jobName=${documentId}`
  //first, try fetching from name resolution
  let items = await fetch(proxy, {
    headers: getHeaders(url, accessToken),
  })
    .then((res) => res.json())
    .then((res) => res?.response?.data?.items)

  if (!items || !items.length) {
    //if that fails, try fetching by fileUri and check the referenceNumber
    const refUrl = `https://api.smartling.com/jobs-api/v3/projects/${project}/jobs/search`
    items = await fetch(proxy, {
      headers: {
        ...getHeaders(refUrl, accessToken),
        'content-type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        fileUris: [documentId],
      }),
    })
      .then((res) => res.json())
      .then((res) => res?.response?.data?.items)
  }

  if (items?.length) {
    //smartling will fuzzy match job names. We need to be precise.
    const correctJob = items
      .filter((item: {jobStatus: string}) => item.jobStatus !== 'DELETED')
      .find(
        (item: {jobName: string; referenceNumber: string}) =>
          (item.jobName && item.jobName === documentId) ||
          (item.referenceNumber && item.referenceNumber === documentId),
      )

    if (correctJob) {
      return correctJob.translationJobUid
    }
  }
  return ''
}
