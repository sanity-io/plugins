import {describe, expect, test} from 'vitest'

import {
  hasPreparingTracks,
  hasUsableCaptionTrack,
  isCaptionTrack,
  isChaptersTrack,
  readyTracksKey,
} from './tracks'

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

describe('what the player plays', () => {
  const video = {type: 'video', id: 'v1'}
  const audio = {type: 'audio', id: 'a1'}

  test('the key follows the ready text and audio tracks only', () => {
    const preparing = {...subtitles, id: 'new', status: 'preparing'}
    const before = readyTracksKey([video, audio, subtitles, preparing])
    expect(before).toBe('a1,6JrrUxP9')
    expect(readyTracksKey([video, audio, subtitles, {...preparing, status: 'ready'}])).not.toBe(
      before,
    )
    expect(readyTracksKey([video, audio, subtitles, preparing])).toBe(before)
  })

  test('a preparing text or audio track is worth waiting for', () => {
    expect(hasPreparingTracks([video, subtitles])).toBe(false)
    expect(hasPreparingTracks([{...audio, status: 'preparing'}])).toBe(true)
    expect(hasPreparingTracks(undefined)).toBe(false)
  })
})
