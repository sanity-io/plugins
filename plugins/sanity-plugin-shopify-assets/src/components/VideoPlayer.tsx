import {useEffect, useRef} from 'react'
import videojs, {type VideoJsPlayer} from 'video.js'

type PlayerKind = 'player' | 'diff'

interface VideoProps {
  src: string
  kind: PlayerKind
}

const className: Record<PlayerKind, string> = {
  player: 'video-js vjs-16-9 vjs-big-play-centered',
  diff: 'video-js vjs-layout-tiny vjs-fluid',
}

const VideoPlayer = ({src, kind}: VideoProps) => {
  const videoContainer = useRef<HTMLDivElement>(null)
  const player = useRef<VideoJsPlayer | undefined>(undefined)

  // Create the player once, mounting an imperatively created <video> element so
  // that Video.js (not React) owns it. This avoids DOM ownership conflicts when
  // the player is disposed. Dispose on unmount so DOM nodes and event handlers
  // aren't leaked, and don't recreate the player on every source change.
  useEffect(() => {
    const container = videoContainer.current
    if (!container) return undefined

    const videoElement = document.createElement('video')
    videoElement.setAttribute('aria-label', 'Video preview')
    videoElement.className = className[kind]
    if (kind === 'diff') videoElement.style.position = 'relative'
    container.appendChild(videoElement)

    const stopPropagation = (event: Event) => event.stopPropagation()
    container.addEventListener('click', stopPropagation)

    const vjsPlayer = videojs(videoElement, {controls: true})
    player.current = vjsPlayer

    return () => {
      container.removeEventListener('click', stopPropagation)
      vjsPlayer.dispose()
      player.current = undefined
    }
  }, [kind])

  // Update the source on the existing player instead of recreating it.
  useEffect(() => {
    player.current?.src({src})
  }, [src])

  return (
    <div>
      <link href="https://vjs.zencdn.net/7.8.4/video-js.css" rel="stylesheet" />
      <div data-vjs-player>
        <div ref={videoContainer} />
      </div>
    </div>
  )
}

export default VideoPlayer
