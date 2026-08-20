import {useMemo} from 'react'
import {type SanityClient, useClient} from 'sanity'

export function useApiClient(): SanityClient {
  const client = useClient({apiVersion: 'vX'})
  return useMemo(() => {
    const customHost = localStorage.getItem('embeddings-index-host')
    if (customHost) {
      return client.withConfig({
        apiHost: customHost,
        // Required so the override host is used as-is (not `{projectId}.{apiHost}`).
        // There is no non-deprecated replacement for this client flag.
        // oxlint-disable-next-line no-deprecated -- custom embeddings-index-host must not be project-prefixed
        useProjectHostname: false,
        withCredentials: false,
      })
    }
    return client
  }, [client])
}
