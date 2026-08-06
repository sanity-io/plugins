import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {EditIcon} from '@sanity/icons/Edit'
import {LockIcon} from '@sanity/icons/Lock'
import {PlayIcon} from '@sanity/icons/Play'
import {Button, Card, Stack, Text, Tooltip} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {DRMWarningDialog, useDrmPlaybackWarningContext} from '../context/DrmPlaybackWarningContext'
import {THUMBNAIL_ASPECT_RATIO} from '../util/constants'
import {getPlaybackPolicy} from '../util/getPlaybackPolicy'
import {type VideoAssetDocument} from '../util/types'
import IconInfo from './IconInfo'
import {AudioIcon} from './icons/Audio'
import VideoMetadata from './VideoMetadata'
import VideoPlayer, {assetIsAudio} from './VideoPlayer'
import VideoThumbnail from './VideoThumbnail'

import {playButton} from './VideoInBrowser.css'

type RenderState = 'render-video' | 'pre-render-warn' | false

export default function VideoInBrowser({
  onSelect,
  onEdit,
  asset,
}: {
  onSelect?: (asset: VideoAssetDocument) => void
  onEdit?: (asset: VideoAssetDocument) => void
  asset: VideoAssetDocument
}) {
  const [renderVideo, setRenderVideo] = useState<RenderState>(false)
  const select = useCallback(() => onSelect?.(asset), [onSelect, asset])
  const edit = useCallback(() => onEdit?.(asset), [onEdit, asset])
  const {hasShownWarning} = useDrmPlaybackWarningContext()

  if (!asset) {
    return null
  }

  const playbackPolicy = getPlaybackPolicy(asset)
  const onClickPlay = () => {
    if (playbackPolicy?.policy === 'drm' && !hasShownWarning) {
      setRenderVideo('pre-render-warn')
    } else {
      setRenderVideo('render-video')
    }
  }
  return (
    <Card
      border
      padding={2}
      sizing="border"
      radius={2}
      style={{
        position: 'relative',
      }}
    >
      {playbackPolicy?.policy === 'signed' && (
        <Tooltip
          animate
          content={
            <Card padding={2} radius={2}>
              <IconInfo icon={LockIcon} text="Signed playback policy" size={2} />
            </Card>
          }
          placement="right"
          fallbackPlacements={['top', 'bottom']}
          portal
        >
          <Card
            tone="caution"
            style={{
              borderRadius: '100%',
              position: 'absolute',
              left: '1em',
              top: '1em',
              zIndex: 11,
            }}
            padding={2}
            border
          >
            <Text muted size={1}>
              <LockIcon />
            </Text>
          </Card>
        </Tooltip>
      )}
      {playbackPolicy?.policy === 'drm' && (
        <Tooltip
          animate
          content={
            <Card padding={2} radius={2}>
              <IconInfo icon={LockIcon} text="DRM playback policy" size={2} />
            </Card>
          }
          placement="right"
          fallbackPlacements={['top', 'bottom']}
          portal
        >
          <Card
            tone="caution"
            style={{
              borderRadius: '0.25rem',
              position: 'absolute',
              left: '1em',
              top: '1em',
              zIndex: 11,
            }}
            padding={2}
            border
          >
            <Text muted size={1} weight="semibold" style={{color: 'var(--card-icon-color)'}}>
              DRM
            </Text>
          </Card>
        </Tooltip>
      )}
      <Stack
        space={3}
        height="fill"
        style={{
          gridTemplateRows: 'min-content min-content 1fr',
        }}
      >
        {renderVideo === 'pre-render-warn' && (
          <DRMWarningDialog
            onClose={() => {
              setRenderVideo('render-video')
            }}
          />
        )}
        {renderVideo === 'render-video' ? (
          <VideoPlayer asset={asset} autoPlay forceAspectRatio={THUMBNAIL_ASPECT_RATIO} />
        ) : (
          <button className={playButton} onClick={onClickPlay}>
            <div data-play>
              <PlayIcon />
            </div>
            {assetIsAudio(asset) ? (
              <div
                style={{
                  aspectRatio: THUMBNAIL_ASPECT_RATIO,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AudioIcon width="3em" height="3em" />
              </div>
            ) : (
              <VideoThumbnail asset={asset} />
            )}
          </button>
        )}
        <VideoMetadata asset={asset} />
        <div
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            gap: '.35rem',
          }}
        >
          {onSelect && (
            <Button
              icon={CheckmarkIcon}
              fontSize={2}
              padding={2}
              mode="ghost"
              text="Select"
              style={{flex: 1}}
              tone="positive"
              onClick={select}
            />
          )}
          <Button
            icon={EditIcon}
            fontSize={2}
            padding={2}
            mode="ghost"
            text="Details"
            style={{flex: 1}}
            onClick={edit}
          />
        </div>
      </Stack>
    </Card>
  )
}
