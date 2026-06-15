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
    <video controls aria-label="Cloudinary video preview" style={style}>
      <source src={src} type="video/mp4" />
      <track kind="captions" />
    </video>
  )
}
