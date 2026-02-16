import {useCallback, useEffect, useRef, useState} from 'react'
import {finalize, share} from 'rxjs'
import {type SanityClient, useClient} from 'sanity'

const query = '* [_id == $id] {secrets}[0]'
const type = 'pluginSecrets'

export interface Secrets<T> {
  loading: boolean
  secrets?: T
  storeSecrets: (secrets: T) => void
}

const sharedListeners = new Map<string, ReturnType<typeof createSharedListener>>()

function createSharedListener(client: SanityClient, id: string) {
  return client.observable.listen(query, {id}, {visibility: 'query', tag: 'secrets.listen'}).pipe(
    finalize(() => sharedListeners.delete(id)),
    share({resetOnRefCountZero: true}),
  )
}

export function useSecrets<T>(namespace: string): Secrets<T> {
  const [loading, setLoading] = useState<boolean>(true)
  const [secrets, setSecrets] = useState<T>()

  // Stabilize the client reference to avoid re-triggering the useEffect
  // when useClient() returns a new object on re-renders.
  const client = useClient({apiVersion: '2021-03-01'})
  const clientRef = useRef(client)
  useEffect(() => {
    clientRef.current = client
  }, [client])

  const id = `secrets.${namespace}`

  // Monotonic counter to prevent a pre-existing race condition: if an SSE
  // event arrives while the initial fetch is in flight, the slower fetch
  // response could overwrite the newer SSE value. Each write increments
  // the counter; the fetch only applies its result if no write occurred
  // since it started.
  const writeVersionRef = useRef(0)

  useEffect(() => {
    if (!sharedListeners.has(id)) {
      sharedListeners.set(id, createSharedListener(clientRef.current, id))
    }
    const subscription = sharedListeners.get(id)!.subscribe((result: Record<string, unknown>) => {
      writeVersionRef.current++
      const resultData = result as {result?: {secrets?: T}}
      setSecrets(resultData?.result?.secrets)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [id])

  useEffect(() => {
    const fetchedAtVersion = writeVersionRef.current
    void clientRef.current
      .fetch(query, {id}, {tag: 'secrets.get'})
      .then((doc: Record<string, unknown> | null) => {
        // Only apply if no SSE event arrived while the fetch was in flight
        if (writeVersionRef.current === fetchedAtVersion) {
          writeVersionRef.current++
          // oxlint-disable-next-line no-unsafe-type-assertion -- The secrets type T is user-defined and we cannot statically verify it
          setSecrets(doc?.['secrets'] as T | undefined)
        }
        return undefined
      })
      .catch(() => {
        // Non-fatal — the SSE listener will deliver the value when it connects
      })
      .finally(() => setLoading(false))
  }, [id])

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
