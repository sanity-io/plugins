import {Flex, Spinner} from '@sanity/ui'
import {APILoadingStatus, useApiLoadingStatus} from '@vis.gl/react-google-maps'
import type {ReactNode} from 'react'

import {InvalidApiKeyCard} from '../input/ApiKeyMessages'

/**
 * Renders the interactive map only once the Maps JavaScript API has loaded.
 * While loading it shows a spinner, and if the key is rejected it surfaces the
 * same "invalid key" guidance used by the static preview. Must be rendered
 * inside an `<APIProvider>`.
 */
export function MapApiGate({children}: {children: ReactNode}) {
  const status = useApiLoadingStatus()

  if (status === APILoadingStatus.AUTH_FAILURE || status === APILoadingStatus.FAILED) {
    return <InvalidApiKeyCard />
  }

  if (status !== APILoadingStatus.LOADED) {
    return (
      <Flex align="center" justify="center" height="fill" padding={4}>
        <Spinner muted />
      </Flex>
    )
  }

  return <>{children}</>
}
