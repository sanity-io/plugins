import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, concat, defer, finalize, from, map, of, shareReplay, tap, timeout} from 'rxjs'
import {type SanityClient, useClient} from 'sanity'

const query = '* [_id == $id] {secrets}[0]'
const type = 'pluginSecrets'

export interface Secrets<T> {
  loading: boolean
  secrets?: T
  storeSecrets: (secrets: T) => void
}

// Shares the entire concat(fetch$, sse$) pipeline so multiple useSecrets
// calls with the same namespace reuse a single fetch + SSE stream.
const sharedStreams = new Map<string, ReturnType<typeof createSharedStream>>()

function createSharedStream(client: SanityClient, id: string, mapKey: string) {
  const fetch$ = defer(() => from(client.fetch(query, {id}, {tag: 'secrets.get'}))).pipe(
    timeout(5_000),
    map((doc) => doc?.['secrets']),
    catchError(() => of(undefined)),
  )
  const sse$ = client.observable
    .listen(query, {id}, {visibility: 'query', tag: 'secrets.listen'})
    // oxlint-disable-next-line no-unsafe-type-assertion
    .pipe(map((result) => (result as {result?: {secrets?: unknown}})?.result?.secrets))
  return concat(fetch$, sse$).pipe(
    finalize(() => sharedStreams.delete(mapKey)),
    shareReplay({bufferSize: 1, refCount: true}),
  )
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
  // don't share streams across different projects or datasets.
  const config = client.config()
  const mapKey = `${config.projectId}.${config.dataset}:${id}`

  const secrets$ = useMemo(() => {
    if (!sharedStreams.has(mapKey)) {
      sharedStreams.set(mapKey, createSharedStream(client, id, mapKey))
    }
    return sharedStreams.get(mapKey)!.pipe(tap(() => setLoading(false)))
  }, [client, id, mapKey])

  // oxlint-disable-next-line no-unsafe-type-assertion
  const secrets = useObservable(secrets$) as T | undefined

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
