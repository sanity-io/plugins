import {useEffect, useMemo, useRef, useSyncExternalStore} from 'react'

import {
  EMPTY_ROBOTS_SNAPSHOT,
  getRobotsSyncStore,
  type RobotsSyncSnapshot,
  type RobotsSyncStore,
} from '../robots/sync'
import type {VideoAssetDocument} from '../util/types'
import {useClient} from './useClient'

const NO_DIRECTIVES: string[] = []
const subscribeToNothing = () => () => {}
const getEmptySnapshot = () => EMPTY_ROBOTS_SNAPSHOT

/**
 * Subscribes to the asset's shared Robots loop while `enabled` (see `RobotsSyncStore`), and
 * keeps it fed with the document as this component sees it.
 */
export function useRobotsSync(
  asset: VideoAssetDocument | null | undefined,
  {
    enabled,
    defaultDirectiveIds = NO_DIRECTIVES,
  }: {enabled: boolean; defaultDirectiveIds?: string[]},
): {store: RobotsSyncStore | undefined; snapshot: RobotsSyncSnapshot} {
  const client = useClient()
  const documentId = asset?._id
  const assetId = asset?.assetId
  const store = useMemo(
    () =>
      enabled && documentId && assetId
        ? getRobotsSyncStore(client, documentId, assetId)
        : undefined,
    [client, enabled, documentId, assetId],
  )
  const snapshot = useSyncExternalStore(
    store?.subscribe ?? subscribeToNothing,
    store?.getSnapshot ?? getEmptySnapshot,
  )

  const subscription = useRef<ReturnType<RobotsSyncStore['register']>>(undefined)
  useEffect(() => {
    if (!store) return undefined
    const registered = store.register(client)
    subscription.current = registered
    return () => {
      registered.unregister()
      subscription.current = undefined
    }
  }, [store, client])

  // Also after `store` changes, so a new subscription gets the inputs straight away.
  useEffect(() => {
    if (store) subscription.current?.update({document: asset ?? undefined, defaultDirectiveIds})
  }, [store, asset, defaultDirectiveIds])

  return {store, snapshot}
}
