import {useMemo} from 'react'
import isEqual from 'react-fast-compare'
import {useObservable} from 'react-rx'
import {catchError, distinctUntilChanged, map, of, startWith} from 'rxjs'
import {type ListenQueryOptions, useClient} from 'sanity'

import {listenQuery} from './fixedListenQuery'

type Params = Record<string, string | number | boolean | string[]>

type ReturnShape<T> = {
  loading: boolean
  error: boolean
  data: T | null
}

const DEFAULT_PARAMS = {}
const DEFAULT_OPTIONS: ListenQueryOptions = {apiVersion: `v2022-05-09`}

const INITIAL_STATE = {loading: true, error: false, data: null} as const

function useStableParams(params: Params): Params {
  const stringified = useMemo(() => JSON.stringify(params), [params])
  return useMemo(() => JSON.parse(stringified), [stringified])
}

function useStableOptions(options: ListenQueryOptions): ListenQueryOptions {
  const stringified = useMemo(() => JSON.stringify(options), [options])
  return useMemo(() => JSON.parse(stringified), [stringified])
}

export function useListeningQuery<T>(
  query: string,
  params: Params = DEFAULT_PARAMS,
  options: ListenQueryOptions = DEFAULT_OPTIONS,
): ReturnShape<T> {
  const client = useClient({apiVersion: `v2022-05-09`})
  const memoParams = useStableParams(params)
  const memoOptions = useStableOptions(options)

  const state$ = useMemo(
    () =>
      query
        ? listenQuery(client, query, memoParams, memoOptions).pipe(
            distinctUntilChanged(isEqual),
            map((documents) => ({
              loading: false,
              error: false,
              // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- listenQuery result is typed by caller
              data: documents as T,
            })),
            startWith({loading: true, error: false, data: null as T | null}),
            catchError((err) => {
              console.error(err)
              return of({loading: false, error: true, data: null as T | null})
            }),
          )
        : of({loading: false, error: false, data: null as T | null}),
    [query, memoParams, memoOptions, client],
  )

  return useObservable(state$, INITIAL_STATE)
}
