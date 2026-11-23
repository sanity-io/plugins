// @vitest-environment jsdom
import {cleanup, render} from '@testing-library/react'
import type {ReactNode} from 'react'
import {afterEach, describe, expect, test, vi} from 'vitest'

import MuxMediaPlayer from './MuxMediaPlayer'

const sources = vi.hoisted(() => ({video: [] as unknown[], audio: [] as unknown[]}))

vi.mock('@videojs/react/video/skin.css', () => ({}))
vi.mock('@videojs/react/audio/skin.css', () => ({}))
vi.mock('@videojs/react/video', () => ({
  VideoPlayer: ({children}: {children: ReactNode}) => <div>{children}</div>,
  VideoSkin: ({children}: {children: ReactNode}) => <div>{children}</div>,
}))
vi.mock('@videojs/react/audio', () => ({
  AudioPlayer: ({children}: {children: ReactNode}) => <div>{children}</div>,
  AudioSkin: ({children}: {children: ReactNode}) => <div>{children}</div>,
}))
vi.mock('@videojs/react/extensions/mux-data', () => ({MuxData: () => null}))
vi.mock('@videojs/react/media/mux-video', () => ({
  MuxVideo: ({source}: {source?: unknown}) => {
    sources.video.push(source)
    return <video />
  },
}))
vi.mock('@videojs/react/media/mux-audio', () => ({
  MuxAudio: ({source}: {source?: unknown}) => {
    sources.audio.push(source)
    return <audio />
  },
}))

afterEach(() => {
  cleanup()
  sources.video.length = 0
  sources.audio.length = 0
})

describe('MuxMediaPlayer', () => {
  // A render React discards would otherwise start loading the stream, and never be destroyed.
  test('hands the source to the player only once it has mounted', () => {
    const source = {playbackId: 'playback-id'}

    render(<MuxMediaPlayer source={source} audio={false} />)

    expect(sources.video[0]).toBeUndefined()
    expect(sources.video.at(-1)).toBe(source)
  })

  test('does the same for audio-only assets', () => {
    const source = {playbackId: 'audio-playback-id'}

    render(<MuxMediaPlayer source={source} audio />)

    expect(sources.audio[0]).toBeUndefined()
    expect(sources.audio.at(-1)).toBe(source)
  })
})
