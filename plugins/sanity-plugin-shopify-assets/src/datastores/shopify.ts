import axios from 'axios'
import {BehaviorSubject, Observable, concat, defer} from 'rxjs'
import {debounceTime, distinctUntilChanged, map, switchMap, withLatestFrom} from 'rxjs/operators'

type SearchSubject = BehaviorSubject<string>
type CursorSubject = BehaviorSubject<any>

interface fetchProps {
  projectId: string
  dataset: string
  shop: string
  query: SearchSubject
  cursor: CursorSubject
  resultsPerPage: number
  token?: string
}

interface searchProps extends Omit<fetchProps, 'query' | 'cursor'> {
  query: string
  cursor: string
}
interface listProps extends Omit<fetchProps, 'query' | 'cursor'> {
  cursor: string
}

const fetchSearch = (props: searchProps): Observable<any> => {
  const {projectId, dataset, shop, query, cursor, resultsPerPage, token} = props

  const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
  const url = `https://${projectId}.api.sanity.io/v1/shopify/assets/${dataset}?shop=${encodeURIComponent(
    shop,
  )}&query=${encodeURIComponent(query)}${cursorParam}&limit=${resultsPerPage}`

  return defer(() =>
    axios.get(url, {
      withCredentials: true,
      method: 'GET',
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    }),
  ).pipe(map((result) => result.data))
}

const fetchList = (props: listProps): Observable<any> => {
  const {projectId, dataset, shop, cursor, resultsPerPage, token} = props

  const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
  const url = `https://${projectId}.api.sanity.io/v1/shopify/assets/${dataset}?shop=${encodeURIComponent(
    shop,
  )}${cursorParam}&limit=${resultsPerPage}`

  return defer(() =>
    axios.get(url, {
      withCredentials: true,
      method: 'GET',
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    }),
  ).pipe(map((result) => result.data))
}

export const search = (props: fetchProps): Observable<any> => {
  const {projectId, dataset, shop, query, cursor, resultsPerPage, token} = props

  return concat(
    query.pipe(
      withLatestFrom(cursor),
      debounceTime(500),
      distinctUntilChanged(
        ([prevQuery, prevCursor], [nextQuery, nextCursor]) =>
          prevQuery === nextQuery && prevCursor === nextCursor,
      ),
      switchMap(([q, c]) => {
        if (q) {
          return fetchSearch({
            projectId,
            dataset,
            shop,
            query: q,
            cursor: c,
            resultsPerPage,
            token,
          }).pipe(distinctUntilChanged())
        }
        return fetchList({projectId, dataset, shop, cursor: c, resultsPerPage, token})
      }),
    ),
  )
}
