import {dequal as isEqual} from 'dequal/lite'
import {useEffect, useMemo, useState} from 'react'
import {defer, distinctUntilChanged, retry, timer} from 'rxjs'
import {type ListenQueryOptions, type ListenQueryParams, useDocumentStore} from 'sanity'

interface Config<V> {
  params?: ListenQueryParams
  options?: ListenQueryOptions
  initialValue?: null | V
}

interface Return<V> {
  loading: boolean
  error: unknown
  data: V | null
}

const DEFAULT_PARAMS = {}
const DEFAULT_OPTIONS = {apiVersion: `v2023-05-01`}
const DEFAULT_INITIAL_VALUE = null

const RETRY_BASE_DELAY_MS = 2000
const RETRY_MAX_DELAY_MS = 30_000

function useParams(params?: null | ListenQueryParams | ListenQueryOptions): ListenQueryParams {
  const stringifiedParams = useMemo(() => JSON.stringify(params || {}), [params])
  return useMemo(() => JSON.parse(stringifiedParams), [stringifiedParams])
}

/**
 * Delay before reconnecting a failed listener: 2s, doubling up to 30s
 */
function getRetryDelay(retryCount: number): number {
  return Math.min(RETRY_BASE_DELAY_MS * 2 ** (retryCount - 1), RETRY_MAX_DELAY_MS)
}

export function useListeningQuery<V>(
  query: string | {fetch: string; listen: string},
  {
    params = DEFAULT_PARAMS,
    options = DEFAULT_OPTIONS,
    initialValue = DEFAULT_INITIAL_VALUE,
  }: Config<V>,
): Return<V> {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [data, setData] = useState<Return<V>['data']>(initialValue)
  const memoParams = useParams(params)
  const memoOptions = useParams(options)

  const documentStore = useDocumentStore()

  useEffect(() => {
    if (!query) {
      return undefined
    }

    const subscription = defer(() => documentStore.listenQuery(query, memoParams, memoOptions))
      .pipe(
        distinctUntilChanged(isEqual),
        // A listener can fail at any point, for instance when the browser has too many requests
        // open to the API and the listener times out waiting for a connection. Report the error,
        // keep the last result, and reconnect with backoff.
        retry({
          resetOnSuccess: true,
          delay: (err: unknown, retryCount) => {
            console.error(err)
            setError(err)
            setLoading(false)

            return timer(getRetryDelay(retryCount))
          },
        }),
      )
      .subscribe((documents) => {
        setData((current) => {
          if (isEqual(current, documents)) {
            return current
          }

          // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- listenQuery result is typed by caller
          return documents as V
        })
        setLoading(false)
        setError(null)
      })

    return () => subscription.unsubscribe()
  }, [query, memoParams, memoOptions, documentStore])

  return {data, loading, error}
}
