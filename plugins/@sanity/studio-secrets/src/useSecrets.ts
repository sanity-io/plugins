import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, concat, defer, finalize, from, map, of, share, tap, timeout} from 'rxjs'
import {type SanityClient, useClient} from 'sanity'

const query = '* [_id == $id] {secrets}[0]'
const type = 'pluginSecrets'

export interface Secrets<T> {
  loading: boolean
  secrets?: T
  storeSecrets: (secrets: T) => void
}

const sharedListeners = new Map<string, ReturnType<typeof createSharedListener>>()

function createSharedListener(client: SanityClient, id: string, mapKey: string) {
  return client.observable.listen(query, {id}, {visibility: 'query', tag: 'secrets.listen'}).pipe(
    finalize(() => sharedListeners.delete(mapKey)),
    share({resetOnRefCountZero: true}),
  )
}

function extractSecrets<T>(doc: Record<string, unknown> | null): T | undefined {
  // oxlint-disable-next-line no-unsafe-type-assertion
  return doc?.['secrets'] as T | undefined
}

export function useSecrets<T>(namespace: string): Secrets<T> {
  const [loading, setLoading] = useState<boolean>(true)

  const client = useClient({apiVersion: '2021-03-01'})
  const clientRef = useRef(client)
  useEffect(() => {
    clientRef.current = client
  }, [client])

  const id = `secrets.${namespace}`

  // Include project/dataset in the Map key so multi-workspace setups
  // don't share SSE listeners across different projects or datasets.
  const config = client.config()
  const mapKey = `${config.projectId}.${config.dataset}:${id}`

  const secrets$ = useMemo(() => {
    if (!sharedListeners.has(mapKey)) {
      sharedListeners.set(mapKey, createSharedListener(client, id, mapKey))
    }
    const fetch$ = defer(() => from(client.fetch(query, {id}, {tag: 'secrets.get'}))).pipe(
      // Added to make sure we handle hanging requests / requests that take too long
      timeout(5_000),
      map((doc) => extractSecrets<T>(doc)),
      catchError(() => of(undefined as T | undefined)),
    )
    const sse$ = sharedListeners.get(mapKey)!.pipe(
      map((result) => {
        // oxlint-disable-next-line no-unsafe-type-assertion
        const resultData = result as {result?: {secrets?: T}}
        return resultData?.result?.secrets
      }),
    )
    return concat(fetch$, sse$).pipe(tap(() => setLoading(false)))
  }, [client, id, mapKey])

  const secrets = useObservable(secrets$)

  const storeSecrets = useCallback(
    (updatedSecret: T) => {
      setLoading(true)
      const currentClient = clientRef.current
      const keysPatch = currentClient.patch(id).set({secrets: updatedSecret})
      void currentClient
        .transaction()
        .createIfNotExists({_id: id, _type: type})
        .patch(keysPatch)
        .commit({visibility: 'async', tag: 'secrets.store'})
        .catch(() => {
          // Non-fatal — the SSE listener will keep showing the last-known value
        })
        .finally(() => setLoading(false))
    },
    [id],
  )

  return {loading, secrets, storeSecrets}
}
