import {describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../__tests__/fixtures/mockSanityClient'
import {assertTagNameAvailable} from './assertTagNameAvailable'

describe('assertTagNameAvailable', () => {
  it('resolves when no tag has the name', async () => {
    const client = createMockSanityClient({fetch: vi.fn(() => Promise.resolve(0))})

    await expect(assertTagNameAvailable(client, 'product')).resolves.toBeUndefined()
    expect(client.fetch).toHaveBeenCalledWith(
      'count(*[_type == "media.tag" && name.current == $name])',
      {name: 'product'},
    )
  })

  it('rejects with a conflict when a tag has the name', async () => {
    const client = createMockSanityClient({fetch: vi.fn(() => Promise.resolve(1))})

    await expect(assertTagNameAvailable(client, 'product')).rejects.toMatchObject({
      message: 'Tag already exists',
      statusCode: 409,
    })
  })
})
