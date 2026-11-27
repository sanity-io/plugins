import {useEffect, useEffectEvent, useRef} from 'react'

import type {ThemerProps} from '#types'

import {writePersistedSnapshot} from './storage'
import {syncThemer, type ThemerSync} from './sync'

/**
 * Persists the machine's snapshot for the next session, and keeps the themes
 * in step with the other tabs of the Studio — from the one tab holding the
 * Web Lock, when the browser is idle; see `sync.ts`. Rendered by the layout,
 * outside the sidebar's `Activity`, so that it runs while the sidebar is
 * closed too: other tabs change the themes whether this one shows them or
 * not.
 */
export function PersistActorSnapshot({send, snapshot}: Pick<ThemerProps, 'send' | 'snapshot'>) {
  const syncRef = useRef<ThemerSync | null>(null)
  const currentSnapshot = useEffectEvent(() => snapshot)

  useEffect(() => {
    const sync = syncThemer(currentSnapshot(), send, {persist: writePersistedSnapshot})
    syncRef.current = sync

    return () => {
      syncRef.current = null
      sync.stop()
    }
  }, [send])

  useEffect(() => {
    syncRef.current?.update(snapshot)
  }, [snapshot])

  return null
}
