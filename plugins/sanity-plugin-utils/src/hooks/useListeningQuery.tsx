import {useMemo} from 'react'
import isEqual from 'react-fast-compare'
import {useObservable} from 'react-rx'
import {catchError, distinctUntilChanged, map, of, startWith} from 'rxjs'
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

function useStableParams(
  params?: null | ListenQueryParams | ListenQueryOptions,
): ListenQueryParams {
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
  const memoParams = useStableParams(params)
  const memoOptions = useStableParams(options)
  const documentStore = useDocumentStore()

  const state$ = useMemo(() => {
    if (!query) {
      return of({loading: false, error: null, data: initialValue})
    }

    try {
      return documentStore.listenQuery(query, memoParams, memoOptions).pipe(
        distinctUntilChanged(isEqual),
        map((documents) => ({
          loading: false,
          error: null,
          // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- listenQuery result is typed by caller
          data: documents as V,
        })),
        startWith({loading: true, error: null, data: initialValue}),
        catchError((err) => {
          console.error(err)
          return of({loading: false, error: err, data: null as V | null})
        }),
      )
    } catch (err) {
      console.error(err)
      return of({loading: false, error: err, data: null as V | null})
    }
  }, [query, memoParams, memoOptions, documentStore, initialValue])

  return useObservable(state$, {loading: true, error: null, data: initialValue})
}
