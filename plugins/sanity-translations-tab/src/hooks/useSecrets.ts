import {useState, useEffect} from 'react'
import type {SanityDocumentLike} from 'sanity'

import {useClient} from './useClient'

interface ReturnProps<T> {
  loading: boolean
  secrets: T | null
}
export function useSecrets<T>(id: string): ReturnProps<T> {
  const [loading, setLoading] = useState<boolean>(true)
  const [secrets, setSecrets] = useState<T | null>(null)
  const client = useClient()

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      return client
        .fetch<SanityDocumentLike | null>('* [_id == $id][0]', {id})
        .then((doc: SanityDocumentLike | null) => {
          if (!isMounted) {
            return undefined
          }

          if (!doc) {
            setSecrets(null)
            setLoading(false)
            return undefined
          }

          const result: Record<string, unknown> = {}
          for (const key in doc) {
            if (key[0] !== '_') {
              result[key] = doc[key]
            }
          }
          // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- secrets document shape is defined by the consumer's Secrets type
          setSecrets(result as T)
          setLoading(false)
          return undefined
        })
        .catch(() => {
          if (!isMounted) {
            return
          }
          setSecrets(null)
          setLoading(false)
        })
    }

    void fetchData()

    return () => {
      isMounted = false
    }
  }, [id, client])

  return {loading, secrets}
}
