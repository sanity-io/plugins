import '@videojs/react/audio/skin.css'
import '@videojs/react/video/skin.css'
import {AudioPlayer, AudioSkin} from '@videojs/react/audio'
import {MuxData} from '@videojs/react/extensions/mux-data'
import {MuxAudio} from '@videojs/react/media/mux-audio'
import {MuxVideo, type MuxSource} from '@videojs/react/media/mux-video'
import {VideoPlayer, VideoSkin} from '@videojs/react/video'
import {type CSSProperties, type RefCallback, useEffect, useState} from 'react'
import {css, styled} from 'styled-components'

import {PLUGIN_VERSION} from '../constants'
import {PreviewAudioSkin, PreviewVideoSkin} from './PreviewSkin'

export interface MuxMediaPlayerProps {
  source: MuxSource
  poster?: string | undefined
  audio: boolean
  autoPlay?: boolean | undefined
  style?: CSSProperties | undefined
  ref?: RefCallback<HTMLMediaElement> | undefined
  /** Use the minimal preview skin instead of the full skin. */
  compact?: boolean | undefined
}

const skinStyles = css`
  --media-border-radius: 0.1875rem;
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
  compact,
}: MuxMediaPlayerProps) {
  // Video.js configures a new player while rendering it. React can discard that render and retry,
  // as when a new caption track remounts the player mid-update, and every discarded player would
  // load the stream and keep retrying it, never destroyed. Without a source until this player has
  // mounted, only the one React commits loads.
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setIsMounted(true)
  }, [])

  const mediaProps = {
    ref,
    source: isMounted ? source : undefined,
    autoPlay,
    playsInline: true,
    preload: 'metadata',
    crossOrigin: 'anonymous',
  } as const

  if (audio) {
    const Skin = compact ? PreviewAudioSkin : StyledAudioSkin

    return (
      <AudioPlayer>
        <Skin style={style}>
          <MuxAudio {...mediaProps} />
          <MuxData metadata={metadata} />
        </Skin>
      </AudioPlayer>
    )
  }

  const Skin = compact ? PreviewVideoSkin : StyledVideoSkin

  return (
    <VideoPlayer title="" poster={poster}>
      <Skin style={style}>
        <MuxVideo {...mediaProps} />
        <MuxData metadata={metadata} />
      </Skin>
    </VideoPlayer>
  )
}
