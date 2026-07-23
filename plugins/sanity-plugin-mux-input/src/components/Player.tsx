import {Card, Text} from '@sanity/ui'
import {useEffect, useRef} from 'react'

import {useCancelUpload} from '../hooks/useCancelUpload'
import type {MuxInputProps, PluginConfig, VideoAssetDocument} from '../util/types'
import {TopControls} from './Player.styled'
import {UploadProgress} from './UploadProgress'
import VideoPlayer from './VideoPlayer'

interface Props extends Pick<MuxInputProps, 'onChange' | 'readOnly'> {
  buttons?: React.ReactNode
  asset: VideoAssetDocument
  config?: PluginConfig
}

const Player = ({asset, buttons, readOnly, onChange, config}: Props) => {
  let isLoading: boolean | string = true
  if (asset?.status === 'preparing') {
    isLoading = 'Preparing the video'
  } else if (asset?.status === 'waiting_for_upload') {
    isLoading = 'Waiting for upload to start'
  } else if (asset?.status === 'waiting') {
    isLoading = 'Processing upload'
  } else if (asset?.status === 'ready' || typeof asset?.status === 'undefined') {
    isLoading = false
  }

  // Legacy: If static_renditions has a status field, it was created with mp4_support (deprecated)
  // We don't process this old format, just return false
  // Note: 'disabled' status is valid in the new format when no renditions were requested
  const staticRenditions = asset?.data?.static_renditions
  const staticRenditionFiles = staticRenditions?.files
  const isPreparingStaticRenditions = Boolean(
    (!staticRenditions?.status || staticRenditions.status === 'disabled') &&
    staticRenditionFiles?.some((file) => file.status === 'preparing'),
  )
  const playRef = useRef<HTMLDivElement>(null)
  const muteRef = useRef<HTMLDivElement>(null)
  const handleCancelUpload = useCancelUpload(asset, onChange)

  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = 'button svg { vertical-align: middle; }'

    if (playRef.current?.shadowRoot) {
      playRef.current.shadowRoot.appendChild(style)
    }
    if (muteRef?.current?.shadowRoot) {
      muteRef.current.shadowRoot.appendChild(style.cloneNode(true))
    }
  }, [])

  useEffect(() => {
    if (asset?.status === 'errored') {
      handleCancelUpload()
      // @TODO use better error handling
      throw new Error(asset.data?.errors?.messages?.join(' '))
    }
  }, [asset.data?.errors?.messages, asset?.status, handleCancelUpload])

  if (!asset || !asset.status) {
    return null
  }

  if (isLoading) {
    return (
      <UploadProgress
        progress={100}
        filename={asset?.filename}
        text={(isLoading !== true && isLoading) || 'Waiting for Mux to complete the upload'}
        onCancel={readOnly ? undefined : () => handleCancelUpload()}
      />
    )
  }

  return (
    <VideoPlayer asset={asset} hlsConfig={config?.hlsConfig}>
      {buttons && <TopControls slot="top-chrome">{buttons}</TopControls>}
      {isPreparingStaticRenditions && (
        <Card
          padding={2}
          radius={1}
          style={{
            background: 'var(--card-fg-color)',
            position: 'absolute',
            top: '0.5em',
            left: '0.5em',
          }}
        >
          <Text size={1} style={{color: 'var(--card-bg-color)'}}>
            MUX is preparing static renditions, please stand by
          </Text>
        </Card>
      )}
    </VideoPlayer>
  )
}

export default Player
