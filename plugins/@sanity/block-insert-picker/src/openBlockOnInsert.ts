import {useCallback, useContext, useEffect, useRef} from 'react'
import {useFormCallbacks} from 'sanity'
import {PortableTextMemberItemsContext} from 'sanity/_singletons'

/**
 * Opens a just-inserted block's editing UI (dialog/popover per the member's
 * config) once its member item mounts. An insert lands synchronously, but the
 * member item only exists on a later render — so callers schedule the key and
 * the effect opens it when it appears.
 *
 * This module is deliberately the ONLY importer of `sanity/_singletons` in
 * this plugin: `PortableTextMemberItemsContext` is an internal, unexported
 * subpath with no stability guarantee, so the dependency stays quarantined
 * here where it can be swapped for a public member-items API in one place.
 * Consumers that need to react to inserts without this internal should use
 * the `onItemInserted` seam on the plugin components instead.
 */
export function useOpenBlockOnInsert(): (blockKey: string) => void {
  const memberItems = useContext(PortableTextMemberItemsContext)
  const {onPathOpen, onSetPathCollapsed} = useFormCallbacks()
  const pendingKeyRef = useRef<null | string>(null)

  useEffect(() => {
    const key = pendingKeyRef.current
    if (!key) return
    const item = memberItems.find((m) => m.member.key === key)
    if (item) {
      onPathOpen(item.member.item.path)
      onSetPathCollapsed(item.member.item.path, false)
      pendingKeyRef.current = null
    }
  }, [memberItems, onPathOpen, onSetPathCollapsed])

  // Stable identity: callers hold this in effect dependency arrays, and the
  // React Compiler is not active in this app to memoize it for them — an
  // unstable return would re-run (and re-register behaviors in) every effect
  // that lists it, on every render.
  return useCallback((blockKey: string) => {
    pendingKeyRef.current = blockKey
  }, [])
}
