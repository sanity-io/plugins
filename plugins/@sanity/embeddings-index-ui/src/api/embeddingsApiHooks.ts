// oxlint-disable typescript/no-deprecated - legacy code will be lint-cleaned in a follow-up PR
import {useMemo} from 'react'
import {type SanityClient, useClient} from 'sanity'

export function useApiClient(): SanityClient {
  const client = useClient({apiVersion: 'vX'})
  return useMemo(() => {
    const customHost = localStorage.getItem('embeddings-index-host')
    if (customHost) {
      return client.withConfig({
        apiHost: customHost,
        useProjectHostname: false,
        withCredentials: false,
      })
    }
    return client
  }, [client])
}
