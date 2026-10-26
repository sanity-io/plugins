import {BehaviorSubject, Observable, concat} from 'rxjs'
import {fromFetch} from 'rxjs/fetch'
import {debounceTime, distinctUntilChanged, switchMap, withLatestFrom} from 'rxjs/operators'

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

const fetchAssets = (url: string, token?: string): Observable<any> =>
  fromFetch(url, {
    credentials: 'include',
    headers: token ? {Authorization: `Bearer ${token}`} : {},
    selector: async (response) => {
      if (response.ok) {
        return response.json()
      }
      const body = await response.json().catch(() => null)
      throw new Error(body?.message || `Request failed with status code ${response.status}`)
    },
  })

const fetchSearch = (props: searchProps): Observable<any> => {
  const {projectId, dataset, shop, query, cursor, resultsPerPage, token} = props

  const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
  const url = `https://${projectId}.api.sanity.io/v1/shopify/assets/${dataset}?shop=${encodeURIComponent(
    shop,
  )}&query=${encodeURIComponent(query)}${cursorParam}&limit=${resultsPerPage}`

  return fetchAssets(url, token)
}

const fetchList = (props: listProps): Observable<any> => {
  const {projectId, dataset, shop, cursor, resultsPerPage, token} = props

  const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
  const url = `https://${projectId}.api.sanity.io/v1/shopify/assets/${dataset}?shop=${encodeURIComponent(
    shop,
  )}${cursorParam}&limit=${resultsPerPage}`

  return fetchAssets(url, token)
}

export const search = (props: fetchProps): Observable<any> => {
  const {projectId, dataset, shop, query, cursor, resultsPerPage, token} = props

  // No value-based dedupe here on purpose: callers clear results and set their
  // loading state before pushing to these subjects, so suppressing a repeated
  // [query, cursor] pair would leave them loading forever. debounceTime already
  // collapses rapid input and switchMap cancels superseded requests.
  return concat(
    query.pipe(
      withLatestFrom(cursor),
      debounceTime(500),
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
