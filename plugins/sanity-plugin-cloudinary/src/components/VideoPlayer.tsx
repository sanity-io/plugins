import type {CSSProperties} from 'react'

type PlayerKind = 'player' | 'diff'

export type VideoPlayerProps = {
  src: string
  kind: PlayerKind
}

export default function VideoPlayer(props: VideoPlayerProps) {
  const {src} = props

  const style: CSSProperties = {
    width: '100%',
    height: 'auto',
  }

  return (
    // Cloudinary videos are user-uploaded and have no caption files to point a
    // `<track>` at; a `src`-less `<track>` would be invalid HTML, so omit it.
    // eslint-disable-next-line jsx-a11y/media-has-caption -- no captions available for arbitrary Cloudinary videos
    <video controls aria-label="Cloudinary video preview" style={style}>
      <source src={src} type="video/mp4" />
    </video>
  )
}
