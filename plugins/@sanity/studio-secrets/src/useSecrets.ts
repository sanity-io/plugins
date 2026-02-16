import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

const query = '* [_id == $id] {secrets}[0]'
const type = 'pluginSecrets'

export interface Secrets<T> {
  loading: boolean
  secrets?: T
  storeSecrets: (secrets: T) => void
}

export function useSecrets<T>(namespace: string): Secrets<T> {
  const [loading, setLoading] = useState<boolean>(true)
  const [secrets, setSecrets] = useState<T>()

  const client = useClient({apiVersion: '2021-03-01'})

  const id = `secrets.${namespace}`

  useEffect(() => {
    const subscription = client.observable
      .listen(query, {id}, {visibility: 'query', tag: 'secrets.listen'})
      .subscribe((result: Record<string, unknown>) => {
        const resultData = result as {result?: {secrets?: T}}
        setSecrets(resultData?.result?.secrets)
      })
    return () => {
      subscription.unsubscribe()
    }
  }, [id, client])

  useEffect(() => {
    void client
      .fetch(query, {id}, {tag: 'secrets.get'})
      .then((doc: Record<string, unknown> | null) => {
        // oxlint-disable-next-line no-unsafe-type-assertion -- The secrets type T is user-defined and we cannot statically verify it
        setSecrets(doc?.['secrets'] as T | undefined)
        return undefined
      })
      .finally(() => setLoading(false))
  }, [id, client])

  const storeSecrets = (updatedSecret: T) => {
    setLoading(true)
    const keysPatch = client.patch(id).set({secrets: updatedSecret})
    void client
      .transaction()
      .createIfNotExists({_id: id, _type: type})
      .patch(keysPatch)
      .commit({visibility: 'async', tag: 'secrets.store'})
      .finally(() => setLoading(false))
  }

  return {loading, secrets, storeSecrets}
}
