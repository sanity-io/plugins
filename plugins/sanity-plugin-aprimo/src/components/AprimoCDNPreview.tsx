import {Box} from '@sanity/ui'

import type {AprimoCDNAsset} from '../types'

type ComponentProps = {
  layout?: 'default' | 'block'
  value: AprimoCDNAsset
  title?: string
}

export function AprimoCDNPreview({
  value,
  layout = 'block',
}: ComponentProps): React.JSX.Element | null {
  const url = value?.rendition?.publicuri
  if (url) {
    return (
      <Box>
        <img
          alt={`preview for ${value?.title}`}
          src={url}
          style={{
            maxWidth: layout === 'block' ? '80px' : '100%',
            height: 'auto',
          }}
        />
      </Box>
    )
  }
  return null
}
