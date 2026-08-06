import {useSecrets} from '@sanity/studio-secrets'
import {DiffFromTo} from 'sanity'

import type {CloudinaryAsset} from '../types'
import {assetUrl} from '../utils'
import {namespace, type Secrets} from './SecretsConfigView'
import VideoPlayer from './VideoPlayer'

import {previewImage, videoDiff} from './AssetDiff.css'

type Props = {
  value: CloudinaryAsset | undefined
}

const CloudinaryDiffPreview = ({value}: Props) => {
  const {secrets} = useSecrets<Secrets>(namespace)
  const cloudName = secrets?.cloudName

  if (!value) {
    return null
  }

  const url = assetUrl(value, cloudName)

  if (value.resource_type === 'video' && url) {
    return (
      <section className={videoDiff}>
        <VideoPlayer src={url} kind="diff" />
      </section>
    )
  }

  return <img alt="preview" src={url} className={previewImage} />
}

type DiffProps = {
  diff: any
  schemaType: any
}

const AssetDiff = ({diff, schemaType}: DiffProps) => {
  return <DiffFromTo diff={diff} schemaType={schemaType} previewComponent={CloudinaryDiffPreview} />
}

export default AssetDiff
