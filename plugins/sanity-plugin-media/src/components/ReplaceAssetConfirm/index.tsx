import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import groq from 'groq'
import pluralize from 'pluralize'
import {useEffect, useState} from 'react'
import {useColorSchemeValue} from 'sanity'

import useVersionedClient from '../../hooks/useVersionedClient'
import type {ImageAsset} from '../../types'
import imageDprUrl from '../../utils/imageDprUrl'
import Image from '../Image'

type Props = {
  assetToReplace?: ImageAsset
  assetToReplaceId: string
  replacement: ImageAsset
}

const AssetPreview = ({asset, label}: {asset?: ImageAsset; label: string}) => {
  const scheme = useColorSchemeValue()
  const dimensions = asset?.metadata?.dimensions

  return (
    <Stack flex={1} gap={2} style={{minWidth: 0}}>
      <Text size={1} weight="semibold">
        {label}
      </Text>
      <Card border radius={2} style={{aspectRatio: '1', overflow: 'hidden'}}>
        {asset && (
          <Image
            alt=""
            draggable={false}
            $scheme={scheme}
            $showCheckerboard={!asset.metadata?.isOpaque}
            src={imageDprUrl(asset, {height: 400, width: 400})}
          />
        )}
      </Card>
      <Text size={1} textOverflow="ellipsis">
        {asset?.originalFilename ?? asset?._id ?? ''}
      </Text>
      {dimensions && (
        <Text muted size={0}>
          {dimensions.width} × {dimensions.height} px
        </Text>
      )}
    </Stack>
  )
}

/** Side-by-side confirmation step shown before image references are rewritten. */
const ReplaceAssetConfirm = ({assetToReplace, assetToReplaceId, replacement}: Props) => {
  const client = useVersionedClient()
  const [referenceCount, setReferenceCount] = useState<{count: number; id: string} | null>(null)

  useEffect(() => {
    const subscription = client.observable
      .fetch<number>(groq`count(*[references($id)])`, {id: assetToReplaceId})
      .subscribe({
        next: (count) => setReferenceCount({count, id: assetToReplaceId}),
        // The count is informational only; the replace itself still works without it.
        error: () => setReferenceCount(null),
      })
    return () => subscription.unsubscribe()
  }, [assetToReplaceId, client])

  const count = referenceCount?.id === assetToReplaceId ? referenceCount.count : undefined

  return (
    <Stack gap={4}>
      <Flex align="center" gap={3}>
        <AssetPreview asset={assetToReplace} label="Current image" />
        <Text muted size={2}>
          <ArrowRightIcon />
        </Text>
        <AssetPreview asset={replacement} label="Replacement" />
      </Flex>

      <Card padding={3} radius={2} tone="caution">
        <Stack gap={3}>
          <Text size={1}>
            {count === undefined
              ? 'Every document that uses the current image will be updated to use the replacement.'
              : `${count} ${pluralize('document', count)} ${count === 1 ? 'uses' : 'use'} the current image and will be updated to use the replacement.`}
          </Text>
          <Text muted size={1}>
            The current image is not deleted.
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}

export default ReplaceAssetConfirm
