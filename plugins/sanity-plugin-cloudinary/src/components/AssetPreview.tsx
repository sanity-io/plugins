import {DocumentIcon} from '@sanity/icons/Document'
import {useSecrets} from '@sanity/studio-secrets'
import {Flex, Text} from '@sanity/ui'

import type {CloudinaryAsset} from '../types'
import {assetUrl} from '../utils'
import {namespace, type Secrets} from './SecretsConfigView'
import VideoPlayer from './VideoPlayer'

import * as styles from './AssetPreview.module.css'

interface AssetPreviewProps {
  layout?: 'default' | 'block'
  value: CloudinaryAsset | undefined
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
        <Flex
          align="center"
          className={layout === 'default' ? styles.videoPreviewDefault : styles.videoPreviewBlock}
        >
          <VideoPlayer src={url} kind="player" />
        </Flex>
      )
    case 'raw':
      return (
        <Flex align="center">
          <DocumentIcon />
          <Text className={styles.rawFileLabel} size={1}>
            {value.display_name ?? 'Raw file'}
          </Text>
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
        <Flex align="center" className={styles.thumbnailFlex} justify="center">
          <img alt="preview" className={styles.thumbnailImage} src={previewSrc} />
        </Flex>
      ) : (
        <div className={styles.fullWidthPreview}>
          <img alt="preview" className={styles.fullWidthImage} src={previewSrc} />
        </div>
      )
    }
  }
}

export default AssetPreview
