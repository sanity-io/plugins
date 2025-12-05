import type {CompactViewProps, PortalConfig, AdditionalInfo} from '@bynder/compact-view'

import {Box, Button, Flex} from '@sanity/ui'
import {useState, lazy, useTransition} from 'react'
import {type ObjectInputProps, PatchEvent, set, unset} from 'sanity'

import type {BynderAssetOptions, BynderAssetValue} from '../schema/bynder.asset'

const VideoPlayer = lazy(() => import('./VideoPlayer'))
const BynderModalLayout = lazy(() => import('./BynderModalLayout'))

export interface BynderConfig {
  portalConfig: PortalConfig
  compactViewOptions: Omit<CompactViewProps, 'onSuccess'>
}

export interface BynderInputProps extends ObjectInputProps<BynderAssetValue> {
  pluginConfig: BynderConfig
}

const getPreviewUrl = (asset: Record<string, any>, addInfo: Record<string, any>) => {
  switch (asset['type']) {
    case 'VIDEO':
      return asset['previewUrls'][0]
    default:
      return addInfo['selectedFile'] ? addInfo['selectedFile']?.url : asset['webImage'].url
  }
}

const getVideoUrl = (asset: Record<string, any>) => {
  if (asset['type'] === 'VIDEO') {
    // if original asset is available (public videos only) use that if not fall back to the preview url
    return asset['files']?.original?.url ?? asset['previewUrls'][0]
  }
  return null
}

const getAspectRatio = (dimensions: {width: number; height: number}): number =>
  dimensions.height / dimensions.width

const getVideoAspectRatio = (previewImageUrl: string) =>
  new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      resolve(
        getAspectRatio({
          width: img.width,
          height: img.height,
        }),
      )
    }
    img.onerror = (err) => reject(err)

    img.src = previewImageUrl
  })

export function BynderInput(props: BynderInputProps): React.JSX.Element {
  const {value, readOnly, schemaType, pluginConfig, onChange} = props
  const [isOpen, setIsOpen] = useState(false)

  // Merge field-level options with global plugin config
  const fieldOptions = schemaType.options as BynderAssetOptions | undefined
  const compactViewOptions = {
    ...pluginConfig.compactViewOptions,
    ...(fieldOptions?.assetTypes && {
      assetTypes: fieldOptions.assetTypes.map((t) => t.toUpperCase()) as ('IMAGE' | 'VIDEO' | 'AUDIO')[],
    }),
    ...(fieldOptions?.assetFilter && {assetFilter: fieldOptions.assetFilter}),
  }

  const removeValue = () => {
    onChange(PatchEvent.from([unset()]))
  }

  const onSuccess = (assets: unknown[], addInfo: AdditionalInfo) => {
    const asset = assets[0] as Record<string, any>
    const webImage = asset['files']?.['webImage']

    const aspectRatio = webImage
      ? getAspectRatio({
          width: webImage.width,
          height: webImage.height,
        })
      : undefined

    // Spread all raw Bynder asset fields first, then override with
    // computed/mapped fields for backward compatibility
    const mediaData = {
      // 1. Spread ALL raw Bynder fields at top level
      ...asset,

      // 2. Required Sanity fields (override any conflicts)
      _key: value?._key,
      _type: schemaType.name,

      // 3. Backward-compatible computed fields (override raw values)
      previewUrl: getPreviewUrl(asset, addInfo),
      previewImg: webImage?.url,
      datUrl: asset['files']?.['transformBaseUrl']?.url,
      videoUrl: getVideoUrl(asset),
      aspectRatio,
      selectedUrl: addInfo.selectedFile?.url,
      width: webImage?.width,
      height: webImage?.height,
    }

    if (asset['type'] === 'VIDEO') {
      getVideoAspectRatio(webImage?.url ?? '')
        .then((ratio) => {
          onChange(PatchEvent.from([set({...mediaData, aspectRatio: ratio})]))
          setIsOpen(false)
        })
        .catch((err) => {
          // video aspect ratio couldn't be set, but should still set the rest of the data
          console.error('Error setting video aspect ratio:', err)
          onChange(PatchEvent.from([set(mediaData)]))
          setIsOpen(false)
        })
    } else {
      onChange(PatchEvent.from([set(mediaData)]))
      setIsOpen(false)
    }
  }

  let preview
  if (value) {
    if (value.type === 'VIDEO') {
      preview = (
        <VideoPlayer controls poster={value.previewImg} sources={[{src: value.previewUrl ?? ''}]} />
      )
    }
    if (value.type === 'IMAGE' || value.type === 'DOCUMENT') {
      preview = (
        <img alt="preview" src={value.previewUrl} style={{width: 'auto', height: '100%', maxHeight: '20rem'}} />
      )
      // TODO: Add preview for audio types and empty state
    }
  }

  const [loading, startTransition] = useTransition()
  const [shouldLoad, setShouldLoad] = useState(false)
  const openCompactView = () => {
    // We want the button to show a loading state if it takes a while to lazy load the modal
    startTransition(() => setShouldLoad(true))
    // Opening the modal should never trigger a loading state
    setIsOpen(true)
  }
  const closeCompactView = () => setIsOpen(false)

  return (
    <>
      <Flex justify="center" align="center" marginBottom={2} onClick={openCompactView} style={{cursor: 'pointer'}}>{preview}</Flex>
      <Flex gap={2} style={{width: '100%'}}>
        <Box flex={1}>
          <Button
            style={{width: '100%'}}
            loading={loading}
            disabled={readOnly}
            mode="ghost"
            text={value ? 'Replace' : 'Browse'}
            title="Select an asset"
            onClick={openCompactView}
          />
        </Box>
        <Box flex={1}>
          <Button
            style={{width: '100%'}}
            disabled={readOnly || !value}
            tone="critical"
            mode="ghost"
            text={'Remove'}
            title="Remove asset"
            onClick={removeValue}
          />
        </Box>
        {shouldLoad && (
          <BynderModalLayout
            isOpen={isOpen}
            onClose={closeCompactView}
            portalConfig={pluginConfig.portalConfig}
            compactViewOptions={compactViewOptions}
            onSuccess={onSuccess}
          />
        )}
      </Flex>
    </>
  )
}
