import type {SanityClient} from 'sanity'
import {describe, expect, test} from 'vitest'

import type {FetcherResult, UnsplashPhoto} from '../types'
import {fetchUnsplashPhotos} from './unsplash'

const PHOTO_ID = 'm2J105CzEAU'

const photo = {
  id: PHOTO_ID,
  width: 4000,
  height: 3000,
  alt_description: 'Cheese plant leaf in clear glass vase',
  urls: {
    full: 'https://images.unsplash.com/full',
    small: 'https://images.unsplash.com/small',
  },
  user: {
    name: 'Example',
    username: 'example',
    links: {html: 'https://unsplash.com/@example'},
  },
  links: {
    html: `https://unsplash.com/photos/${PHOTO_ID}`,
    self: `https://api.unsplash.com/photos/${PHOTO_ID}`,
    download: `https://unsplash.com/photos/${PHOTO_ID}/download`,
    download_location: `https://api.unsplash.com/photos/${PHOTO_ID}/download`,
  },
} satisfies UnsplashPhoto

type RequestOptions = {url: string; method?: string; withCredentials?: boolean}

function httpError(statusCode: number): Error & {statusCode: number} {
  return Object.assign(new Error(`HTTP ${statusCode}`), {statusCode})
}

function mockClient(request: (options: RequestOptions) => Promise<unknown>): SanityClient {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- only request() is called
  return {request} as unknown as SanityClient
}

/**
 * Mirrors the Unsplash proxy: keyword search for a photo id returns nothing,
 * and GET /photos/:id returns the photo. Any other id 404s.
 */
function createClient(): {client: SanityClient; calls: RequestOptions[]} {
  const calls: RequestOptions[] = []
  const client = mockClient(async (options) => {
    calls.push(options)
    const url = options.url
    if (url === `/addons/unsplash/photos/${PHOTO_ID}`) return photo
    if (url.startsWith('/addons/unsplash/photos/')) throw httpError(404)
    if (url.startsWith('/addons/unsplash/search/photos?')) {
      const query = new URL(url, 'https://studio.example').searchParams.get('query')
      if (query === 'mountains' || query === 'skyscrapers') {
        const page: FetcherResult = {
          results: [photo],
          total: 10_000,
          total_pages: 239,
        }
        return page
      }
      return {results: [], total: 0, total_pages: 0}
    }
    if (url.startsWith('/addons/unsplash/photos?')) return [photo]
    throw new Error(`unexpected request ${url}`)
  })
  return {client, calls}
}

describe('fetchUnsplashPhotos', () => {
  test.each([
    PHOTO_ID,
    `  ${PHOTO_ID}  `,
    `https://unsplash.com/photos/${PHOTO_ID}`,
    `https://unsplash.com/photos/${PHOTO_ID}/download`,
    `https://unsplash.com/photos/${PHOTO_ID}/`,
    `https://www.unsplash.com/photos/${PHOTO_ID}?utm_source=unsplash`,
    `https://unsplash.com/photos/cheese-plant-leaf-in-clear-glass-vase-${PHOTO_ID}`,
    `unsplash.com/photos/${PHOTO_ID}`,
  ])('returns the photo for %s', async (query) => {
    const {client, calls} = createClient()

    const result = await fetchUnsplashPhotos(client, query, 1)

    expect(result).toEqual({results: [photo], total: 1, total_pages: 1})
    expect(calls).toEqual([
      {
        url: `/addons/unsplash/photos/${PHOTO_ID}`,
        method: 'GET',
        withCredentials: true,
      },
    ])
  })

  test.each(['5cBUfly-igk', '-jQxoqwZE8w', '_FGEmrZu5_o'])('resolves photo id %s', async (id) => {
    const calls: RequestOptions[] = []
    const match = {...photo, id}
    const client = mockClient(async (options) => {
      calls.push(options)
      if (options.url === `/addons/unsplash/photos/${encodeURIComponent(id)}`) return match
      throw new Error(`unexpected request ${options.url}`)
    })

    const result = await fetchUnsplashPhotos(client, id, 1)

    expect(result.results.map((item) => item.id)).toEqual([id])
    expect(calls).toHaveLength(1)
  })

  test('resolves a slug whose id itself contains a hyphen', async () => {
    const id = '5cBUfly-igk'
    const calls: RequestOptions[] = []
    const client = mockClient(async (options) => {
      calls.push(options)
      return {...photo, id}
    })

    await fetchUnsplashPhotos(client, `https://unsplash.com/photos/blue-hour-${id}`, 1)

    expect(calls[0]?.url).toBe(`/addons/unsplash/photos/${id}`)
  })

  test('does not append keyword results on the next page of an id match', async () => {
    const {client, calls} = createClient()

    const result = await fetchUnsplashPhotos(client, PHOTO_ID, 2)

    expect(result).toEqual({results: [], total: 1, total_pages: 1})
    expect(calls.map((call) => call.url)).toEqual([`/addons/unsplash/photos/${PHOTO_ID}`])
  })

  test('keeps keyword search on the search endpoint', async () => {
    const {client, calls} = createClient()

    const result = await fetchUnsplashPhotos(client, 'mountains', 2)

    expect(result.total).toBe(10_000)
    expect(calls).toEqual([
      {
        url: '/addons/unsplash/search/photos?page=2&per_page=42&query=mountains',
        method: 'GET',
        withCredentials: true,
      },
    ])
  })

  test('falls back to keyword search when an 11-character word is not a photo', async () => {
    const {client, calls} = createClient()

    const result = await fetchUnsplashPhotos(client, 'skyscrapers', 1)

    expect(result.total).toBe(10_000)
    expect(calls.map((call) => call.url)).toEqual([
      '/addons/unsplash/photos/skyscrapers',
      '/addons/unsplash/search/photos?page=1&per_page=42&query=skyscrapers',
    ])
  })

  test('does not treat a longer query, or another site, as a photo id', async () => {
    const {client, calls} = createClient()

    await fetchUnsplashPhotos(client, `leaf ${PHOTO_ID}`, 1)
    await fetchUnsplashPhotos(client, `https://example.com/photos/${PHOTO_ID}`, 1)

    expect(calls.map((call) => call.url)).toEqual([
      `/addons/unsplash/search/photos?page=1&per_page=42&query=leaf+${PHOTO_ID}`,
      `/addons/unsplash/search/photos?page=1&per_page=42&query=https%3A%2F%2Fexample.com%2Fphotos%2F${PHOTO_ID}`,
    ])
  })

  test('lists popular photos when the query is empty', async () => {
    const {client, calls} = createClient()

    const result = await fetchUnsplashPhotos(client, '   ', 1)

    expect(result.results).toEqual([photo])
    expect(result.total).toBe(1)
    expect(calls[0]?.url).toBe('/addons/unsplash/photos?page=1&per_page=42&order_by=popular')
  })

  test('does not hide photo lookup failures other than not found', async () => {
    const calls: RequestOptions[] = []
    const client = mockClient(async (options) => {
      calls.push(options)
      throw httpError(503)
    })

    await expect(fetchUnsplashPhotos(client, PHOTO_ID, 1)).rejects.toMatchObject({statusCode: 503})
    expect(calls).toHaveLength(1)
  })
})
