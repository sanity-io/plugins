import {useEffect, useRef, useState} from 'react'
import videojs, {type VideoJsPlayer, type VideoJsPlayerOptions} from 'video.js'

export default function VideoPlayer(props: VideoJsPlayerOptions): React.JSX.Element {
  const videoNode = useRef<HTMLVideoElement>(null)
  const [player, setPlayer] = useState<VideoJsPlayer>()

  useEffect(() => {
    if (videoNode.current) {
      setPlayer(videojs(videoNode.current, props))
    }
    return () => player?.dispose()
  }, [videoNode, player, props])

  return (
    <div>
      <link href="https://vjs.zencdn.net/7.8.4/video-js.css" rel="stylesheet" />
      <div data-vjs-player style={{marginBottom: '16px'}}>
        {/* oxlint-disable-next-line media-has-caption */}
        <video className="video-js vjs-16-9 vjs-big-play-centered" ref={videoNode} />
      </div>
    </div>
  )
}
