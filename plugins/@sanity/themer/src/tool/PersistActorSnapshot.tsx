import {useEffect} from 'react'

import type {ThemerProps} from './context'
import {writePersistedSnapshot} from './storage'

export function PersistActorSnapshot({actorRef}: Pick<ThemerProps, 'actorRef'>) {
  useEffect(() => {
    let cancel: any
    function cancelOrClear() {
      if ('cancelIdleCallback' in window) {
        cancelIdleCallback(cancel)
      } else {
        clearTimeout(cancel)
      }
    }

    // @TODO use a selector or similar to only subscribe to changes that are relevant to the persisted snapshot
    // @TODO use WebLocks and BroadcastChannel to ensure the snapshot is persisted in a consistent way cross tabs
    const subscription = actorRef.subscribe(() => {
      cancelOrClear()
      const callback = () => {
        const persistedSnapshot = actorRef.getPersistedSnapshot()
        writePersistedSnapshot(persistedSnapshot)
      }
      cancel =
        'cancelIdleCallback' in window ? requestIdleCallback(callback) : setTimeout(callback, 1_000)
    })
    return () => {
      subscription.unsubscribe()
      cancelOrClear()
    }
  }, [actorRef])

  return null
}
