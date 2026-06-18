import {type CSSProperties, type MouseEvent, useCallback, useEffect, useRef} from 'react'
import videojs, {type VideoJsPlayer} from 'video.js'

type PlayerKind = 'player' | 'diff'

interface VideoProps {
  src: string
  kind: PlayerKind
}

const VideoPlayer = ({src, kind}: VideoProps) => {
  const videoNode = useRef<HTMLVideoElement>(null)
  const player = useRef<VideoJsPlayer | undefined>(undefined)

  // Initialize the player once the <video> node is mounted, and dispose it on
  // unmount so DOM nodes and event handlers aren't leaked.
  useEffect(() => {
    const videoElement = videoNode.current
    if (!videoElement) return undefined

    const vjsPlayer = videojs(videoElement, {controls: true})
    player.current = vjsPlayer

    return () => {
      vjsPlayer.dispose()
      player.current = undefined
    }
  }, [])

  // Update the source on the existing player instead of recreating it.
  useEffect(() => {
    player.current?.src({src})
  }, [src])

  const stopPropagation = useCallback((event: MouseEvent) => {
    event.stopPropagation()
  }, [])

  const className: Record<PlayerKind, string> = {
    player: 'video-js vjs-16-9 vjs-big-play-centered',
    diff: 'video-js vjs-layout-tiny vjs-fluid',
  }

  const style: CSSProperties = {position: 'relative'}

  return (
    <div>
      <link href="https://vjs.zencdn.net/7.8.4/video-js.css" rel="stylesheet" />
      <div data-vjs-player>
        {/* Shopify assets do not provide caption tracks */}
        {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          aria-label="Video preview"
          onClick={stopPropagation}
          style={kind === 'diff' ? style : {}}
          className={className[kind]}
          ref={videoNode}
        />
      </div>
    </div>
  )
}

export default VideoPlayer
