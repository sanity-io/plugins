import {DiffFromTo} from 'sanity'

import type {CloudinaryAsset} from '../types'
import {assetUrl} from '../utils'
import VideoPlayer from './VideoPlayer'

type Props = {
  value: CloudinaryAsset | undefined
}

const CloudinaryDiffPreview = ({value}: Props) => {
  if (!value) {
    return null
  }

  const url = assetUrl(value)

  if (value.resource_type === 'video' && url) {
    return (
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <VideoPlayer src={url} kind="diff" />
      </section>
    )
  }

  return <img alt="preview" src={url} style={{maxWidth: '100%', height: 'auto'}} />
}

type DiffProps = {
  diff: any
  schemaType: any
}

const AssetDiff = ({diff, schemaType}: DiffProps) => {
  return <DiffFromTo diff={diff} schemaType={schemaType} previewComponent={CloudinaryDiffPreview} />
}

export default AssetDiff
