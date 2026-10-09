import type {SanityClient} from 'sanity'

import type {FetcherResult, UnsplashPhoto} from '../types'

const RESULTS_PER_PAGE = 42

// Unsplash photo ids are 11 characters from this alphabet, including leading `-` or `_`.
const PHOTO_ID_LENGTH = 11
const PHOTO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

function unsplashPhotoIdFromQuery(query: string): string | undefined {
  const trimmed = query.trim()
  if (PHOTO_ID_PATTERN.test(trimmed)) return trimmed

  const url = unsplashPhotoPageUrl(trimmed)
  if (!url) return undefined

  const segments = url.pathname.split('/').filter(Boolean)
  if (segments[0] !== 'photos' || !segments[1]) return undefined

  let slug: string
  try {
    slug = decodeURIComponent(segments[1])
  } catch {
    return undefined
  }

  if (PHOTO_ID_PATTERN.test(slug)) return slug
  if (slug.length <= PHOTO_ID_LENGTH) return undefined

  const candidate = slug.slice(-PHOTO_ID_LENGTH)
  const separator = slug.charAt(slug.length - PHOTO_ID_LENGTH - 1)
  if ((separator === '-' || separator === '_') && PHOTO_ID_PATTERN.test(candidate)) return candidate
  return undefined
}

function unsplashPhotoPageUrl(value: string): URL | undefined {
  const withProtocol = /^(?:www\.)?unsplash\.com\//i.test(value) ? `https://${value}` : value
  let url: URL
  try {
    url = new URL(withProtocol)
  } catch {
    return undefined
  }

  const host = url.hostname.toLowerCase()
  if (host !== 'unsplash.com' && host !== 'www.unsplash.com') return undefined
  return url
}

export async function fetchUnsplashPhotos(
  client: SanityClient,
  query: string,
  page: number,
): Promise<FetcherResult> {
  // Keyword search does not match photo ids (`m2J105CzEAU` returns zero hits).
  // GET /photos/:id returns the image. A normal 11-character word 404s and falls through.
  const photoId = unsplashPhotoIdFromQuery(query)
  if (photoId) {
    const photo = await fetchPhotoById(client, photoId)
    if (photo) {
      return page === 1
        ? {results: [photo], total: 1, total_pages: 1}
        : {results: [], total: 1, total_pages: 1}
    }
  }

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

async function fetchPhotoById(
  client: SanityClient,
  photoId: string,
): Promise<UnsplashPhoto | undefined> {
  try {
    const photo = await client.request<UnsplashPhoto>({
      url: `/addons/unsplash/photos/${encodeURIComponent(photoId)}`,
      withCredentials: true,
      method: 'GET',
    })
    if (!photo || photo.id !== photoId) return undefined
    return photo
  } catch (error) {
    if (isNotFound(error)) return undefined
    throw error
  }
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'statusCode' in error && error.statusCode === 404
  )
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
