import type {SanityClient} from 'sanity'

import {type BehaviorSubject, concat, defer, type Observable} from 'rxjs'
import {debounceTime, distinctUntilChanged, map, switchMap, withLatestFrom} from 'rxjs/operators'

import type {UnsplashPhoto} from '../types'

type SearchSubject = BehaviorSubject<string>
type PageSubject = BehaviorSubject<number>

const fetchSearch = (
  client: SanityClient,
  query: string,
  page: number,
  perPage: number,
): Observable<any> =>
  defer(
    () =>
      client.observable.request({
        url: `/addons/unsplash/search/photos?query=${encodeURIComponent(
          query,
        )}&page=${page}&per_page=${perPage}`,
        withCredentials: true,
        method: 'GET',
      }) as any,
  )

const fetchList = (
  client: SanityClient,
  type: string,
  page: number,
  perPage: number,
): Observable<any> =>
  defer(
    () =>
      client.observable.request({
        url: `/addons/unsplash/photos?order_by=${type}&page=${page}&per_page=${perPage}`,
        withCredentials: true,
        method: 'GET',
      }) as any,
  )

export function fetchDownloadUrl(client: SanityClient, photo: UnsplashPhoto): Promise<string> {
  const downloadUrl = photo.links.download_location.replace(
    'https://api.unsplash.com',
    '/addons/unsplash',
  )
  return client
    .request({
      url: downloadUrl,
      withCredentials: true,
      method: 'GET',
    })
    .then((result: {url: string}) => {
      return result.url
    })
}

export const search = (
  client: SanityClient,
  query: SearchSubject,
  page: PageSubject,
  resultsPerPage: number,
): Observable<any> => {
  return concat(
    query.pipe(
      withLatestFrom(page),
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(([q, p]) => {
        if (q) {
          return fetchSearch(client, q, p, resultsPerPage).pipe(
            distinctUntilChanged(),
            map((result) => result.results),
          )
        }
        return fetchList(client, 'popular', p, resultsPerPage)
      }),
    ),
  )
}
