import type {SanityClient} from 'sanity'
import {expect, test} from 'vitest'

import type {UnsplashPhoto} from '../types'
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

/**
 * Keyword search for this id returns zero photos. The photo itself is served by
 * `GET /photos/:id`. The mock mirrors that: only the photo endpoint knows the id.
 */
function clientWhereSearchMissesPhotoIds(): {client: SanityClient; calls: RequestOptions[]} {
  const calls: RequestOptions[] = []
  const client = {
    request: async (options: RequestOptions) => {
      calls.push(options)
      if (options.url.startsWith(`/addons/unsplash/photos/${PHOTO_ID}`)) return photo
      if (options.url.startsWith('/addons/unsplash/search/photos?')) {
        return {results: [], total: 0, total_pages: 0}
      }
      throw new Error(`unexpected request ${options.url}`)
    },
  } as unknown as SanityClient
  return {client, calls}
}

test('searching an Unsplash photo id returns that photo', async () => {
  const {client, calls} = clientWhereSearchMissesPhotoIds()

  const result = await fetchUnsplashPhotos(client, PHOTO_ID, 1)

  expect(result.results.map((item) => item.id)).toEqual([PHOTO_ID])
  expect(result.total).toBe(1)
  expect(calls.map((call) => call.url)).toEqual([`/addons/unsplash/photos/${PHOTO_ID}`])
})
