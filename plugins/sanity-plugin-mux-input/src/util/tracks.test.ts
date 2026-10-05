import {describe, expect, test} from 'vitest'

import {hasUsableCaptionTrack, isCaptionTrack, isChaptersTrack} from './tracks'

// As the asset GET returns them after a generate-chapters job.
const subtitles = {
  type: 'text',
  text_type: 'subtitles',
  text_source: 'uploaded',
  status: 'ready',
  name: 'EN (Generated) (edited)',
  language_code: 'en',
  id: '6JrrUxP9',
}
const chapters = {
  type: 'text',
  text_type: 'chapters',
  text_source: 'uploaded',
  status: 'ready',
  name: 'Chapters (Generated)',
  language_code: 'es',
  id: 'ZKzr9Csx',
}

describe('text tracks', () => {
  test('tells captions from chapters', () => {
    expect(isCaptionTrack(subtitles)).toBe(true)
    expect(isChaptersTrack(subtitles)).toBe(false)
    expect(isCaptionTrack(chapters)).toBe(false)
    expect(isChaptersTrack(chapters)).toBe(true)
  })

  test('still counts a text track stored without text_type as captions', () => {
    expect(isCaptionTrack({type: 'text', status: 'ready'})).toBe(true)
    expect(isCaptionTrack({type: 'audio'})).toBe(false)
    expect(isCaptionTrack(undefined)).toBe(false)
  })

  test('needs a ready or preparing caption track for Robots, which chapters never are', () => {
    expect(hasUsableCaptionTrack([chapters])).toBe(false)
    expect(hasUsableCaptionTrack([{...subtitles, status: 'errored'}])).toBe(false)
    expect(hasUsableCaptionTrack([chapters, {...subtitles, status: 'preparing'}])).toBe(true)
    expect(hasUsableCaptionTrack(undefined)).toBe(false)
  })
})
