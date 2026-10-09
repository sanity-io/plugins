import {useCallback, useMemo, useState} from 'react'
import {useSyncObservable} from 'react-rx'
import {map} from 'rxjs'
import {useClient, useDocumentPreviewStore} from 'sanity'

const type = 'pluginSecrets'

export interface Secrets<T> {
  loading: boolean
  secrets?: T
  storeSecrets: (secrets: T) => void
}

const INITIAL_STATE = {loading: true, secrets: undefined}

export function useSecrets<T>(namespace: string): Secrets<T> {
  const [saving, setSaving] = useState(false)

  const client = useClient({apiVersion: '2021-03-01'})
  const documentPreviewStore = useDocumentPreviewStore()
  const id = `secrets.${namespace}`

  const secrets$ = useMemo(
    () =>
      documentPreviewStore.unstable_observeDocument(id).pipe(
        map((doc) => ({
          loading: false,
          // oxlint-disable-next-line no-unsafe-type-assertion
          secrets: (doc as Record<string, unknown> | undefined)?.['secrets'] as T | undefined,
        })),
      ),
    [id, documentPreviewStore],
  )

  // Kept synchronous: the stream is keyed to the live `namespace` and consumers
  // read `secrets` straight into API clients and form state, so a deferred
  // snapshot could hand them the previous namespace's secrets as `loading: false`
  // or lag a just-saved value behind the store.
  const {loading: readLoading, secrets} = useSyncObservable(secrets$, INITIAL_STATE)

  const storeSecrets = useCallback(
    (updatedSecret: T) => {
      setSaving(true)
      const keysPatch = client.patch(id).set({secrets: updatedSecret})
      void client
        .transaction()
        .createIfNotExists({_id: id, _type: type})
        .patch(keysPatch)
        .commit({visibility: 'async', tag: 'secrets.store'})
        .catch(() => {
          // Non-fatal — the listener will deliver the updated value
        })
        .finally(() => setSaving(false))
    },
    [client, id],
  )

  return {loading: readLoading || saving, secrets, storeSecrets}
}
