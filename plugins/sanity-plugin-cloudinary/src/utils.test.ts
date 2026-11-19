import {describe, expect, test} from 'vitest'

import {assetUrl, videoPreviewSources} from './utils'

describe('assetUrl', () => {
  test('builds a scaled url-gen preview URL when cloudName and public_id are provided', () => {
    const url = assetUrl(
      {
        public_id: 'folder/sample',
        resource_type: 'image',
        type: 'upload',
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg',
      },
      'demo',
    )

    expect(url).toContain('https://res.cloudinary.com/demo/')
    // Previews are scaled to a 400px wide transformation instead of the original
    expect(url).toContain('c_scale,w_400')
    expect(url).toContain('folder/sample')
  })

  test('keeps the original video URL when cloudName is provided', () => {
    const url = assetUrl(
      {
        public_id: 'folder/clip',
        resource_type: 'video',
        type: 'upload',
        secure_url: 'https://res.cloudinary.com/demo/video/upload/v1/folder/clip.mp4',
        url: 'http://res.cloudinary.com/demo/video/upload/v1/folder/clip.mp4',
      },
      'demo',
    )

    expect(url).toBe('https://res.cloudinary.com/demo/video/upload/v1/folder/clip.mp4')
    expect(url).not.toContain('/image/upload')
    expect(url).not.toContain('c_scale')
  })

  test('keeps the original raw URL when cloudName is provided', () => {
    const url = assetUrl(
      {
        public_id: 'folder/doc',
        resource_type: 'raw',
        type: 'upload',
        secure_url: 'https://res.cloudinary.com/demo/raw/upload/v1/folder/doc.pdf',
      },
      'demo',
    )

    expect(url).toBe('https://res.cloudinary.com/demo/raw/upload/v1/folder/doc.pdf')
    expect(url).not.toContain('c_scale')
  })

  test('keeps the stored URL for private delivery-type assets', () => {
    const url = assetUrl(
      {
        public_id: 'folder/sample',
        resource_type: 'image',
        type: 'private',
        secure_url: 'https://res.cloudinary.com/demo/image/private/s--abc--/v1/folder/sample.jpg',
      },
      'demo',
    )

    expect(url).toBe('https://res.cloudinary.com/demo/image/private/s--abc--/v1/folder/sample.jpg')
    expect(url).not.toContain('c_scale')
  })

  test('keeps the stored URL for authenticated delivery-type assets', () => {
    const url = assetUrl(
      {
        public_id: 'folder/sample',
        resource_type: 'image',
        type: 'authenticated',
        secure_url:
          'https://res.cloudinary.com/demo/image/authenticated/s--xyz--/v1/folder/sample.jpg',
      },
      'demo',
    )

    expect(url).toBe(
      'https://res.cloudinary.com/demo/image/authenticated/s--xyz--/v1/folder/sample.jpg',
    )
    expect(url).not.toContain('c_scale')
  })

  test('falls back to the stored secure_url when no cloudName is provided', () => {
    const url = assetUrl({
      public_id: 'folder/sample',
      resource_type: 'image',
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg',
      url: 'http://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg',
    })

    expect(url).toBe('https://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg')
  })

  test('does not use url-gen when cloudName is provided but public_id is missing', () => {
    const url = assetUrl(
      {
        resource_type: 'image',
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg',
      },
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
      resource_type: 'video',
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

  test('prefers derived transforms over url-gen when cloudName is provided', () => {
    const url = assetUrl(
      {
        public_id: 'folder/sample',
        resource_type: 'image',
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/folder/sample.jpg',
        derived: [
          {
            raw_transformation: 'a_45',
            url: 'http://res.cloudinary.com/demo/image/upload/a_45/v1/folder/sample.jpg',
            secure_url: 'https://res.cloudinary.com/demo/image/upload/a_45/v1/folder/sample.jpg',
          },
        ],
      },
      'demo',
    )

    expect(url).toBe('https://res.cloudinary.com/demo/image/upload/a_45/v1/folder/sample.jpg')
    expect(url).not.toContain('c_scale')
  })
})

describe('videoPreviewSources', () => {
  const video = {resource_type: 'video', type: 'upload'}
  const original = 'https://res.cloudinary.com/demo/video/upload/v1/folder/clip.mov'

  test('leaves the URL alone when no options are set', () => {
    expect(videoPreviewSources(video, original, {})).toEqual({src: original})
  })

  test('plays a transformed copy and falls back to the original', () => {
    expect(videoPreviewSources(video, original, {transformation: 'q_auto,w_640'})).toEqual({
      src: 'https://res.cloudinary.com/demo/video/upload/q_auto,w_640/v1/folder/clip.mov',
      fallbackSrc: original,
      poster: undefined,
    })
  })

  test('builds a first-frame poster, with the transformation when one is set', () => {
    expect(videoPreviewSources(video, original, {poster: true}).poster).toBe(
      'https://res.cloudinary.com/demo/video/upload/so_0/v1/folder/clip.jpg',
    )
    expect(
      videoPreviewSources(video, `${original}?_a=x`, {poster: true, transformation: 'w_640'})
        .poster,
    ).toBe('https://res.cloudinary.com/demo/video/upload/so_0,w_640/v1/folder/clip.jpg?_a=x')
  })

  test.each([
    ['signed URLs', video, 'https://res.cloudinary.com/demo/video/upload/s--abc123--/v1/clip.mp4'],
    ['authenticated assets', {resource_type: 'video', type: 'authenticated'}, original],
    [
      'derived videos',
      {...video, derived: [{_type: 'cloudinary.assetDerived', raw_transformation: 'w_100'}]},
      'https://res.cloudinary.com/demo/video/upload/w_100/v1/folder/clip.mp4',
    ],
    ['images', {resource_type: 'image', type: 'upload'}, original],
  ])('leaves %s alone', (_, asset, url) => {
    expect(
      videoPreviewSources(asset as Parameters<typeof videoPreviewSources>[0], url, {
        transformation: 'q_auto',
        poster: true,
      }),
    ).toEqual({src: url})
  })
})
