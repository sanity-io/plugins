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
    function fetchData() {
      void client.fetch('* [_id == $id][0]', {id}).then((doc: SanityDocumentLike) => {
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
    }
    fetchData()
  }, [id, client])

  return {loading, secrets}
}
