import type {SanityClient} from 'sanity'

import type {UnsplashPhoto} from '../types'

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
