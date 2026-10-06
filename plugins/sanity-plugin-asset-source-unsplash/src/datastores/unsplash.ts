import type {SanityClient} from 'sanity'

import type {FetcherResult, UnsplashPhoto} from '../types'

const RESULTS_PER_PAGE = 42

export async function fetchUnsplashPhotos(
  client: SanityClient,
  query: string,
  page: number,
): Promise<FetcherResult> {
  const searchParams = new URLSearchParams({
    page: `${page}`,
    per_page: `${RESULTS_PER_PAGE}`,
  })
  const trimmed = query.trim()
  if (trimmed) {
    searchParams.set('query', trimmed)
    return client.request<FetcherResult>({
      url: `/addons/unsplash/search/photos?${searchParams}`,
      withCredentials: true,
      method: 'GET',
    })
  }

  searchParams.set('order_by', 'popular')
  const results = await client.request<UnsplashPhoto[]>({
    url: `/addons/unsplash/photos?${searchParams}`,
    withCredentials: true,
    method: 'GET',
  })
  return {
    results,
    total: results.length,
    total_pages: Math.ceil(results.length / RESULTS_PER_PAGE),
  }
}

export async function fetchDownloadUrl(
  client: SanityClient,
  photo: UnsplashPhoto,
): Promise<string> {
  const downloadUrl = photo.links.download_location.replace(
    'https://api.unsplash.com',
    '/addons/unsplash',
  )
  const {url} = await client.request<{url: string}>({
    url: downloadUrl,
    withCredentials: true,
    method: 'GET',
  })

  return url
}
