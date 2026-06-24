import {useState} from 'react'

import {InvalidApiKeyCard} from './ApiKeyMessages'
import {PreviewImage} from './GeopointInput.styles'

interface StaticMapPreviewProps {
  src: string
  alt: string
  onClick?: () => void
  onDoubleClick?: () => void
}

/**
 * Renders the Google Static Maps preview image. If the request is rejected
 * (invalid/demo key, a restricted key, or one without Static Maps API access)
 * the broken image is replaced with a helpful error card.
 *
 * The parent passes `key={src}` so this remounts (and retries) whenever the
 * image URL changes — e.g. after the location or the API key changes.
 */
export function StaticMapPreview({src, alt, onClick, onDoubleClick}: StaticMapPreviewProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <InvalidApiKeyCard />
  }

  return (
    <PreviewImage
      src={src}
      alt={alt}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onError={() => setFailed(true)}
    />
  )
}
