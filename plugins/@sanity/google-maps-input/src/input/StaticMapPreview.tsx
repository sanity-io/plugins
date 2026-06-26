import {StaticMap} from '@vis.gl/react-google-maps'
import {useState} from 'react'

import {InvalidApiKeyCard} from './ApiKeyMessages'

import {staticMapContainer, staticMapImage} from './StaticMapPreview.css'

interface StaticMapPreviewProps {
  url: string
  onClick?: () => void
  onDoubleClick?: () => void
}

/**
 * Renders the Google Static Maps preview (via the library's `StaticMap`). If
 * the image is rejected (invalid/demo key, restricted, or missing Static Maps
 * API access) the broken image is replaced with a helpful error card.
 */
export function StaticMapPreview({url, onClick, onDoubleClick}: StaticMapPreviewProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <InvalidApiKeyCard />
  }

  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
    <div
      className={staticMapContainer}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onErrorCapture={() => setFailed(true)}
    >
      <StaticMap className={staticMapImage} url={url} />
    </div>
  )
}
