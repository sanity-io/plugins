import {dequal as isEqual} from 'dequal/lite'
import {useEffect, useMemo, useState} from 'react'
import {defer, distinctUntilChanged, retry, throwError, timer} from 'rxjs'
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

/**
 * Whether reconnecting could fix the error. The errors come from `@sanity/client`, which might be
 * a different copy than any we could import, so they are matched by name and status rather than
 * with `instanceof`.
 */
function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return true
  }

  // The server rejected the listener's query (`ChannelError`), or told it to go away
  // (`DisconnectError`)
  if (err.name === 'ChannelError' || err.name === 'DisconnectError') {
    return false
  }

  // A `ClientError` from the fetch (like a query parse error) has a `statusCode`. A
  // `ConnectionFailedError` from the listener has a `status`, but only where the EventSource
  // exposes it, which browsers don't.
  if ('statusCode' in err && typeof err.statusCode === 'number') {
    return !isPermanentHttpError(err.statusCode)
  }

  if ('status' in err && typeof err.status === 'number') {
    return !isPermanentHttpError(err.status)
  }

  return true
}

/** 4xx errors fail the same way when retried, except timeouts and rate limits */
function isPermanentHttpError(status: number): boolean {
  return status >= 400 && status < 500 && status !== 408 && status !== 429
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

    // Errors keep the last result, so a component can still show it
    const reportError = (err: unknown) => {
      console.error(err)
      setError(err)
      setLoading(false)
    }

    const subscription = defer(() => documentStore.listenQuery(query, memoParams, memoOptions))
      .pipe(
        distinctUntilChanged(isEqual),
        // A listener can fail at any point, for instance when the browser has too many requests
        // open to the API and the listener times out waiting for a connection. Reconnect with
        // backoff, unless the error would happen again.
        retry({
          resetOnSuccess: true,
          delay: (err: unknown, retryCount) => {
            if (!isRetryableError(err)) {
              return throwError(() => err)
            }

            reportError(err)
            return timer(getRetryDelay(retryCount))
          },
        }),
      )
      .subscribe({
        next: (documents) => {
          setData((current) => {
            if (isEqual(current, documents)) {
              return current
            }

            // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- listenQuery result is typed by caller
            return documents as V
          })
          setLoading(false)
          setError(null)
        },
        error: reportError,
      })

    return () => subscription.unsubscribe()
  }, [query, memoParams, memoOptions, documentStore])

  return {data, loading, error}
}
