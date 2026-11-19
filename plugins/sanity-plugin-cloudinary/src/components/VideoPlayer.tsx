import type {CSSProperties} from 'react'

import type {CloudinaryVideoPreviewOptions} from '../types'

type PlayerKind = 'player' | 'diff'

export type VideoPlayerProps = {
  src: string
  kind: PlayerKind
  /** Played if `src` fails to load, e.g. when Cloudinary rejects a preview transformation. */
  fallbackSrc?: string
  poster?: string
  preload?: CloudinaryVideoPreviewOptions['preload']
}

export default function VideoPlayer(props: VideoPlayerProps) {
  const {src, fallbackSrc, poster, preload} = props

  const style: CSSProperties = {
    width: '100%',
    height: 'auto',
  }

  return (
    // Cloudinary videos are user-uploaded and have no caption files to point a
    // `<track>` at; a `src`-less `<track>` would be invalid HTML, so omit it.
    // eslint-disable-next-line jsx-a11y/media-has-caption -- no captions available for arbitrary Cloudinary videos
    <video
      controls
      preload={preload}
      poster={poster}
      aria-label="Cloudinary video preview"
      style={style}
    >
      <source src={src} type="video/mp4" />
      {fallbackSrc ? <source src={fallbackSrc} type="video/mp4" /> : null}
    </video>
  )
}
