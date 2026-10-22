import {useEffect} from 'react'

import type {ThemerProps} from '#types'

import {readPersistedState, writePersistedSnapshot} from './storage'
import {syncThemer} from './sync'

/**
 * Persists the machine's snapshot for the next session, and keeps the themes
 * in step with the other tabs of the Studio — from the one tab holding the
 * Web Lock, when the browser is idle; see `sync.ts`. Rendered by the layout,
 * outside the sidebar's `Activity`, so that it runs while the sidebar is
 * closed too: other tabs change the themes whether this one shows them or
 * not.
 */
export function PersistActorSnapshot({actorRef}: Pick<ThemerProps, 'actorRef'>) {
  useEffect(
    () => syncThemer(actorRef, {persist: writePersistedSnapshot, restore: readPersistedState}),
    [actorRef],
  )

  return null
}
