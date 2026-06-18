import {describe, expect, test} from 'vitest'

import {assetUrl} from './utils'

describe('assetUrl', () => {
  test('builds a scaled url-gen preview URL when cloudName and public_id are provided', () => {
    const url = assetUrl(
      {
        public_id: 'folder/sample',
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg',
      },
      'demo',
    )

    expect(url).toContain('https://res.cloudinary.com/demo/')
    // Previews are scaled to a 400px wide transformation instead of the original
    expect(url).toContain('c_scale,w_400')
    expect(url).toContain('folder/sample')
  })

  test('falls back to the stored secure_url when no cloudName is provided', () => {
    const url = assetUrl({
      public_id: 'folder/sample',
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg',
      url: 'http://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg',
    })

    expect(url).toBe('https://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg')
  })

  test('does not use url-gen when cloudName is provided but public_id is missing', () => {
    const url = assetUrl(
      {secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg'},
      'demo',
    )

    expect(url).toBe('https://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg')
    expect(url).not.toContain('c_scale')
  })

  test('falls back to the original url when secure_url is absent', () => {
    const url = assetUrl({url: 'http://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg'})

    expect(url).toBe('http://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg')
  })

  test('prefers a derived secure_url over the base asset url', () => {
    const url = assetUrl({
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/base.jpg',
      derived: [
        {
          raw_transformation: 'a_45',
          url: 'http://res.cloudinary.com/demo/image/upload/a_45/v1/derived.jpg',
          secure_url: 'https://res.cloudinary.com/demo/image/upload/a_45/v1/derived.jpg',
        },
      ],
    })

    expect(url).toBe('https://res.cloudinary.com/demo/image/upload/a_45/v1/derived.jpg')
  })
})
