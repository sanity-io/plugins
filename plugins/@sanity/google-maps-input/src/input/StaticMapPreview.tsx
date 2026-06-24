import {StaticMap} from '@vis.gl/react-google-maps'
import {useState} from 'react'

import {InvalidApiKeyCard} from './ApiKeyMessages'
import {StaticMapContainer} from './GeopointInput.styles'

interface StaticMapPreviewProps {
  url: string
  onClick?: () => void
  onDoubleClick?: () => void
}

/**
 * Renders the Google Static Maps preview (via the library's `StaticMap`). If
 * the image is rejected (invalid/demo key, restricted, or missing Static Maps
 * API access) the broken image is replaced with a helpful error card.
 *
 * The parent passes `key={url}` so this remounts (and retries) when the image
 * URL changes, e.g. after the location or the API key changes.
 */
export function StaticMapPreview({url, onClick, onDoubleClick}: StaticMapPreviewProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <InvalidApiKeyCard />
  }

  return (
    <StaticMapContainer
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onErrorCapture={() => setFailed(true)}
    >
      <StaticMap url={url} />
    </StaticMapContainer>
  )
}
