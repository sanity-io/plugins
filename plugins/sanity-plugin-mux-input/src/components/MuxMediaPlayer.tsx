import '@videojs/react/audio/skin.css'
import '@videojs/react/video/skin.css'
import {AudioPlayer, AudioSkin} from '@videojs/react/audio'
import {MuxData} from '@videojs/react/extensions/mux-data'
import {MuxAudio} from '@videojs/react/media/mux-audio'
import {MuxVideo, type MuxSource} from '@videojs/react/media/mux-video'
import {VideoPlayer, VideoSkin} from '@videojs/react/video'
import type {CSSProperties, RefCallback} from 'react'
import {css, styled} from 'styled-components'

import {PLUGIN_VERSION} from '../constants'

export interface MuxMediaPlayerProps {
  source: MuxSource
  poster?: string | undefined
  audio: boolean
  autoPlay?: boolean | undefined
  style?: CSSProperties | undefined
  ref?: RefCallback<HTMLMediaElement> | undefined
}

const skinStyles = css`
  --media-border-radius: 0.1875rem;

  .media-cast-button[data-availability='unavailable'] {
    display: none;
  }
`

const StyledVideoSkin = styled(VideoSkin)`
  ${skinStyles}
`

const StyledAudioSkin = styled(AudioSkin)`
  ${skinStyles}
`

const metadata = {
  player_name: 'Sanity Admin Dashboard',
  player_version: PLUGIN_VERSION,
  page_type: 'Preview Player',
}

export default function MuxMediaPlayer({
  source,
  poster,
  audio,
  autoPlay,
  style,
  ref,
}: MuxMediaPlayerProps) {
  const mediaProps = {
    ref,
    source,
    autoPlay,
    playsInline: true,
    preload: 'metadata',
    crossOrigin: 'anonymous',
  } as const

  if (audio) {
    return (
      <AudioPlayer>
        <StyledAudioSkin style={style}>
          <MuxAudio {...mediaProps} />
          <MuxData metadata={metadata} />
        </StyledAudioSkin>
      </AudioPlayer>
    )
  }

  return (
    <VideoPlayer title="" poster={poster}>
      <StyledVideoSkin style={style}>
        <MuxVideo {...mediaProps} />
        <MuxData metadata={metadata} />
      </StyledVideoSkin>
    </VideoPlayer>
  )
}
