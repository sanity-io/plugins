import {useEffect, useMemo, useRef, useState} from 'react'
import isEqual from 'react-fast-compare'
import {Subscription} from 'rxjs'
import {catchError, distinctUntilChanged} from 'rxjs/operators'
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

function useParams(params?: null | ListenQueryParams | ListenQueryOptions): ListenQueryParams {
  const stringifiedParams = useMemo(() => JSON.stringify(params || {}), [params])
  return useMemo(() => JSON.parse(stringifiedParams), [stringifiedParams])
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

  const subscription = useRef<null | Subscription>(null)
  const documentStore = useDocumentStore()

  useEffect(() => {
    if (query && !error && !subscription.current) {
      try {
        subscription.current = documentStore
          .listenQuery(query, memoParams, memoOptions)
          .pipe(
            distinctUntilChanged(isEqual),
            catchError((err) => {
              console.error(err)
              setError(err)
              setLoading(false)
              setData(null)

              return err
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
      } catch (err) {
        console.error(err)
        // oxlint-disable-next-line react-hooks-js/set-state-in-effect -- sync error handling for subscription setup
        setLoading(false)
        setError(err)
      }
    }

    // Unsubscribe when an error occurs
    if (error && subscription.current) {
      subscription.current.unsubscribe()
    }

    return () => {
      if (subscription.current) {
        subscription?.current?.unsubscribe()
        subscription.current = null
      }
    }
  }, [query, error, memoParams, memoOptions, documentStore])

  return {data, loading, error}
}
