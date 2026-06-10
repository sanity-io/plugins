import type {SanityClient} from 'sanity'
import {expect, test, vi} from 'vitest'

import {getTranslationMetadata} from './getTranslationMetadata'

test('queries metadata in both the v5 (_key) and v6 (language) formats', async () => {
  const fetch = vi.fn(() => Promise.resolve(null))
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- partial mock of SanityClient
  const client = {fetch} as unknown as SanityClient

  await getTranslationMetadata('doc-id', client, 'en')

  expect(fetch).toHaveBeenCalledTimes(1)
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('language == $baseLanguage || _key == $baseLanguage'),
    {baseLanguage: 'en', id: 'doc-id'},
  )
})
