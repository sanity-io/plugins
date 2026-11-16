// @vitest-environment jsdom
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import {afterEach, describe, expect, test, vi} from 'vitest'

import type {VideoAssetDocument} from '../util/types'
import type {MuxMediaPlayerProps} from './MuxMediaPlayer'
import VideoPlayer from './VideoPlayer'

vi.mock('./MuxMediaPlayer', () => ({
  default: (props: MuxMediaPlayerProps) => (
    <div
      data-testid="media-player"
      data-autoplay={String(Boolean(props.autoPlay))}
      data-audio={String(props.audio)}
      data-poster={props.poster ?? ''}
      data-source={JSON.stringify(props.source)}
    />
  ),
}))

vi.mock('../hooks/useClient', () => ({
  useClient: () => ({}),
}))

vi.mock('../util/generateJwt', () => ({
  generateJwt: (_client: unknown, playbackId: string, aud: string) => `${aud}.${playbackId}`,
}))

const theme = buildTheme()

function Wrapper({children}: {children: ReactNode}) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

const asset: VideoAssetDocument = {
  _id: 'video-asset',
  _type: 'mux.videoAsset',
  _createdAt: '2026-10-01T00:00:00Z',
  status: 'ready',
  playbackId: 'public-playback-id',
  data: {
    aspect_ratio: '16:9',
    playback_ids: [{id: 'public-playback-id', policy: 'public'}],
  },
}

async function findSource() {
  const player = await screen.findByTestId('media-player')
  return JSON.parse(player.dataset['source']!)
}

afterEach(() => {
  cleanup()
})

describe('VideoPlayer', () => {
  test('mounts the player eagerly by default', async () => {
    render(<VideoPlayer asset={asset} />, {wrapper: Wrapper})

    expect((await screen.findByTestId('media-player')).dataset['autoplay']).toBe('false')
    expect(screen.queryByRole('button', {name: 'Play video'})).toBeNull()
    expect(await findSource()).toEqual({playbackId: 'public-playback-id'})
  })

  test('with deferPlayer, renders the poster and mounts the player only after a click', async () => {
    render(
      <VideoPlayer asset={asset} deferPlayer>
        <div data-testid="overlay" />
      </VideoPlayer>,
      {wrapper: Wrapper},
    )

    expect(screen.queryByTestId('media-player')).toBeNull()
    expect(screen.getAllByTestId('overlay')).toHaveLength(1)
    const playButton = screen.getByRole('button', {name: 'Play video'})
    expect(playButton.querySelector('img')?.getAttribute('src')).toMatch(
      /^https:\/\/image\.mux\.com\/public-playback-id\/thumbnail\.png\?/,
    )

    fireEvent.click(playButton)

    expect((await screen.findByTestId('media-player')).dataset['autoplay']).toBe('true')
    expect(screen.queryByRole('button', {name: 'Play video'})).toBeNull()
    expect(screen.getAllByTestId('overlay')).toHaveLength(1)
  })

  test('signs playback, storyboard and poster with their own token audiences', async () => {
    const signedAsset: VideoAssetDocument = {
      ...asset,
      playbackId: 'signed-playback-id',
      data: {
        aspect_ratio: '16:9',
        playback_ids: [{id: 'signed-playback-id', policy: 'signed'}],
      },
    }
    render(<VideoPlayer asset={signedAsset} />, {wrapper: Wrapper})

    expect(await findSource()).toEqual({
      playbackId: 'signed-playback-id',
      playback: {token: 'v.signed-playback-id'},
      storyboard: {token: 's.signed-playback-id'},
    })
    expect(screen.getByTestId('media-player').dataset['poster']).toBe(
      'https://image.mux.com/signed-playback-id/thumbnail.png?token=t.signed-playback-id',
    )
  })

  test('adds a DRM license token for DRM playback IDs', async () => {
    const drmAsset: VideoAssetDocument = {
      ...asset,
      playbackId: 'drm-playback-id',
      data: {
        aspect_ratio: '16:9',
        playback_ids: [{id: 'drm-playback-id', policy: 'drm'}],
      },
    }
    render(<VideoPlayer asset={drmAsset} />, {wrapper: Wrapper})

    expect(await findSource()).toEqual({
      playbackId: 'drm-playback-id',
      playback: {token: 'v.drm-playback-id'},
      storyboard: {token: 's.drm-playback-id'},
      drm: {token: 'd.drm-playback-id'},
    })
  })

  test('passes the hls.js config to the engine', async () => {
    render(<VideoPlayer asset={asset} hlsConfig={{maxBufferLength: 7}} />, {wrapper: Wrapper})

    expect(await findSource()).toEqual({
      playbackId: 'public-playback-id',
      engine: {hlsJs: {maxBufferLength: 7}},
    })
  })

  test('renders the audio player without a poster for audio-only assets', async () => {
    const audioAsset: VideoAssetDocument = {
      ...asset,
      data: {...asset.data, max_stored_resolution: 'Audio only'},
    }
    render(<VideoPlayer asset={audioAsset} />, {wrapper: Wrapper})

    const player = await screen.findByTestId('media-player')
    expect(player.dataset['audio']).toBe('true')
    expect(player.dataset['poster']).toBe('')
  })
})
