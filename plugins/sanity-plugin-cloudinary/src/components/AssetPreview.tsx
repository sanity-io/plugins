import {DocumentIcon} from '@sanity/icons/Document'
import {useSecrets} from '@sanity/studio-secrets'
import {Flex, Text} from '@sanity/ui'
import type {ComponentProps} from 'react'

import type {CloudinaryAsset} from '../types'
import {assetUrl} from '../utils'
import {namespace, type Secrets} from './SecretsConfigView'
import VideoPlayer from './VideoPlayer'

import {
  fullWidthImage,
  fullWidthPreview,
  rawFileLabel,
  thumbnailFlex,
  thumbnailImage,
  videoPreview,
} from './AssetPreview.css'

interface AssetPreviewProps {
  layout?: 'default' | 'block'
  value: CloudinaryAsset | undefined
}

function VideoPreviewFlex({
  layout,
  className,
  ...props
}: ComponentProps<typeof Flex> & {layout?: 'default' | 'block'}) {
  const layoutClass = videoPreview[layout === 'default' ? 'default' : 'block']
  return <Flex {...props} className={className ? `${layoutClass} ${className}` : layoutClass} />
}

function RawFileLabel({className, ...props}: ComponentProps<typeof Text>) {
  return <Text {...props} className={className ? `${rawFileLabel} ${className}` : rawFileLabel} />
}

function ThumbnailFlex({className, ...props}: ComponentProps<typeof Flex>) {
  return <Flex {...props} className={className ? `${thumbnailFlex} ${className}` : thumbnailFlex} />
}

function FullWidthPreview({className, ...props}: ComponentProps<'div'>) {
  return (
    <div {...props} className={className ? `${fullWidthPreview} ${className}` : fullWidthPreview} />
  )
}

const AssetPreview = ({value, layout}: AssetPreviewProps) => {
  const {secrets} = useSecrets<Secrets>(namespace)
  const cloudName = secrets?.cloudName

  if (!value || !cloudName) {
    return null
  }

  const url = assetUrl(value, cloudName)
  if (!url) {
    return null
  }

  switch (value.resource_type) {
    case 'video':
      return (
        <VideoPreviewFlex align="center" layout={layout}>
          <VideoPlayer src={url} kind="player" />
        </VideoPreviewFlex>
      )
    case 'raw':
      return (
        <Flex align="center">
          <DocumentIcon />
          <RawFileLabel size={1}>{value.display_name ?? 'Raw file'}</RawFileLabel>
        </Flex>
      )
    default: {
      // Cloudinary returns resource_type as "image" even for PDFs, so we check
      // the format to handle PDFs specifically: convert the first page to JPG
      // and overlay a "PDF" label for thumbnail clarity.
      const previewSrc =
        value.format === 'pdf'
          ? url.replace(
              'image/upload',
              'image/upload/f_jpg,pg_1,l_text:Verdana_75_letter_spacing_14:PDF',
            )
          : url

      return layout === 'default' ? (
        <ThumbnailFlex align="center" justify="center">
          <img alt="preview" src={previewSrc} className={thumbnailImage} />
        </ThumbnailFlex>
      ) : (
        <FullWidthPreview>
          <img alt="preview" src={previewSrc} className={fullWidthImage} />
        </FullWidthPreview>
      )
    }
  }
}

export default AssetPreview
