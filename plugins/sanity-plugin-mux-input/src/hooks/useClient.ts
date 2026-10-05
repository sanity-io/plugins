// As it's required to specify the API Version this custom hook ensures it's all using the same version
import {useMemo} from 'react'
import {useClient as useSanityClient} from 'sanity'

import {useMuxApiHost} from '../context/MuxApiHostContext'
import {withMuxApiHost} from '../util/muxAddonClient'

export const SANITY_API_VERSION = '2024-03-05'

export function useClient() {
  const client = useSanityClient({apiVersion: SANITY_API_VERSION})
  const muxApiHost = useMuxApiHost()
  // Without `muxApiHost`, return the Studio client unchanged.
  // With it, Mux addon requests made via `getMuxAddonClient(client)` go to that host.
  return useMemo(
    () => (muxApiHost ? withMuxApiHost(client, muxApiHost) : client),
    [client, muxApiHost],
  )
}
