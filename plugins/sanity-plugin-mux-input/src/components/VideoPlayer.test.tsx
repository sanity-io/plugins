// @vitest-environment jsdom
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import {afterEach, describe, expect, test, vi} from 'vitest'

import type {VideoAssetDocument} from '../util/types'
import VideoPlayer from './VideoPlayer'

vi.mock('@mux/mux-player-react/lazy', () => ({
  default: (props: {autoPlay?: boolean}) => (
    <div data-testid="mux-player" data-autoplay={String(Boolean(props.autoPlay))} />
  ),
}))

vi.mock('../hooks/useClient', () => ({
  useClient: () => ({}),
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

afterEach(() => {
  cleanup()
})

describe('VideoPlayer', () => {
  test('mounts the player eagerly by default', () => {
    render(<VideoPlayer asset={asset} />, {wrapper: Wrapper})

    expect(screen.getByTestId('mux-player').dataset['autoplay']).toBe('false')
    expect(screen.queryByRole('button', {name: 'Play video'})).toBeNull()
  })

  test('with deferPlayer, renders the poster and mounts the player only after a click', () => {
    render(
      <VideoPlayer asset={asset} deferPlayer>
        <div data-testid="overlay" />
      </VideoPlayer>,
      {wrapper: Wrapper},
    )

    expect(screen.queryByTestId('mux-player')).toBeNull()
    expect(screen.getAllByTestId('overlay')).toHaveLength(1)
    const playButton = screen.getByRole('button', {name: 'Play video'})
    expect(playButton.querySelector('img')?.getAttribute('src')).toMatch(
      /^https:\/\/image\.mux\.com\/public-playback-id\/thumbnail\.png\?/,
    )

    fireEvent.click(playButton)

    expect(screen.getByTestId('mux-player').dataset['autoplay']).toBe('true')
    expect(screen.queryByRole('button', {name: 'Play video'})).toBeNull()
  })
})
