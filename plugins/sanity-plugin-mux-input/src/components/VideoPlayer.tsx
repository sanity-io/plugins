import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {PlayIcon} from '@sanity/icons/Play'
import {Card, Text} from '@sanity/ui'
import type {MuxSource} from '@videojs/react/media/mux-video'
import {lazy, type PropsWithChildren, Suspense, useMemo, useRef, useState} from 'react'

import {useDialogStateContext} from '../context/DialogStateContext'
import {useClient} from '../hooks/useClient'
import {AUDIO_ASPECT_RATIO, MIN_ASPECT_RATIO} from '../util/constants'
import {generateJwt} from '../util/generateJwt'
import {getPlaybackId} from '../util/getPlaybackPolicy'
import {getPlaybackPolicyById} from '../util/getPlaybackPolicy'
import {getPosterSrc} from '../util/getPosterSrc'
import {readyTracksKey} from '../util/tracks'
import {tryWithSuspend} from '../util/tryWithSuspend'
import type {PluginConfig, VideoAssetDocument} from '../util/types'
import CaptionsDialog from './CaptionsDialog'
import EditThumbnailDialog from './EditThumbnailDialog'
import {AudioIcon} from './icons/Audio'
import MezzanineDialog from './MezzanineDialog'
import {NoPlaybackIdNotice} from './NoPlaybackIdNotice'
import {PlayButton} from './PlayButton'

const MuxMediaPlayer = lazy(() => import('./MuxMediaPlayer'))

export default function VideoPlayer({
  asset,
  thumbnailWidth = 250,
  children,
  hlsConfig,
  deferPlayer = false,
  readOnly,
  ...props
}: PropsWithChildren<{
  asset: VideoAssetDocument
  thumbnailWidth?: number
  forceAspectRatio?: number
  hlsConfig?: PluginConfig['hlsConfig']
  /**
   * Render the poster as a play button and mount the player only once it's clicked.
   * Mounting the player's controls forces many full-document layouts, which freezes Safari
   * for seconds when a form shows several video fields.
   */
  deferPlayer?: boolean
  readOnly?: boolean
  autoPlay?: boolean
}>) {
  const client = useClient()
  const {dialogState} = useDialogStateContext()

  const isAudio = assetIsAudio(asset)
  const [media, setMedia] = useState<HTMLMediaElement | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<Error>()
  const [playerRequested, setPlayerRequested] = useState(false)
  const showPlayer = !deferPlayer || playerRequested

  // Robots `moderate` can delete every playback ID; the notice below says how to restore one.
  const hasPlaybackIds = !!asset.data?.playback_ids?.length
  /* Playback ID that will be used to play the video */
  const playbackId = hasPlaybackIds ? getPlaybackId(asset, ['public', 'signed', 'drm']) : undefined
  // Strings, so an unrelated document change doesn't sign a new token and reload the player.
  const policy = playbackId ? getPlaybackPolicyById(asset, playbackId)?.policy : undefined

  const signTokens = useMemo(() => {
    if (!playbackId || (policy !== 'signed' && policy !== 'drm')) return undefined
    return tryWithSuspend(
      () => ({
        playback: generateJwt(client, playbackId, 'v'),
        storyboard: generateJwt(client, playbackId, 's'),
        drm: policy === 'drm' ? generateJwt(client, playbackId, 'd') : undefined,
      }),
      (e: Error) => {
        setError(e)
        return undefined
      },
    )
  }, [client, policy, playbackId])

  const source = useMemo<MuxSource | undefined>(() => {
    if (!playbackId || !policy) return undefined
    const signed = policy === 'signed' || policy === 'drm'
    if (signed && !signTokens) return undefined
    return {
      playbackId,
      playback: signTokens ? {token: signTokens.playback} : undefined,
      storyboard: signTokens ? {token: signTokens.storyboard} : undefined,
      drm: signTokens?.drm ? {token: signTokens.drm} : undefined,
      engine: hlsConfig ? {hlsJs: hlsConfig} : undefined,
    }
  }, [playbackId, policy, signTokens, hlsConfig])

  const poster = useMemo(() => {
    if (!hasPlaybackIds) return undefined
    return tryWithSuspend(
      () => getPosterSrc({asset, client, width: thumbnailWidth}),
      (e: Error) => {
        setError(e)
        return undefined
      },
    )
  }, [asset, client, thumbnailWidth, hasPlaybackIds])

  const [width, height] = (asset?.data?.aspect_ratio ?? '16:9').split(':').map(Number)
  const targetAspectRatio =
    props.forceAspectRatio || (Number.isNaN(width) ? 16 / 9 : width! / height!)
  let aspectRatio = Math.max(MIN_ASPECT_RATIO, targetAspectRatio)
  if (isAudio) {
    aspectRatio = props.forceAspectRatio
      ? // Make it wider when forcing aspect ratio to balance with videos' rendering height (audio players overflow a bit)
        props.forceAspectRatio * 1.2
      : AUDIO_ASPECT_RATIO
  }

  /* We use Suspense here because `generateJwt` and related functions use suspend()
   under the hood */
  return (
    <>
      <Card
        ref={playerContainerRef}
        tone="transparent"
        style={{
          aspectRatio: aspectRatio,
          position: 'relative',
          ...(isAudio && {display: 'flex', alignItems: 'flex-end'}),
        }}
      >
        {source && poster && (
          <>
            {isAudio && (
              <AudioIcon
                style={{
                  padding: '0.5em',
                  width: '2.2em',
                  height: '2.2em',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 1,
                }}
              />
            )}
            {showPlayer ? (
              <Suspense fallback={null}>
                <MuxMediaPlayer
                  // A new caption or audio track reaches the player only with a fresh manifest.
                  key={`${playbackId}:${readyTracksKey(asset.data?.tracks)}`}
                  ref={setMedia}
                  source={source}
                  poster={isAudio ? undefined : poster}
                  audio={isAudio}
                  autoPlay={deferPlayer || props.autoPlay}
                  style={{
                    ...(!isAudio && {height: '100%'}),
                    width: '100%',
                    ...(isAudio && {alignSelf: 'end'}),
                  }}
                />
              </Suspense>
            ) : (
              <PlayButton
                type="button"
                aria-label={isAudio ? 'Play audio' : 'Play video'}
                onClick={() => setPlayerRequested(true)}
                style={{position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0}}
              >
                {!isAudio && (
                  <img
                    src={poster}
                    alt=""
                    style={{width: '100%', height: '100%', display: 'block', objectFit: 'contain'}}
                  />
                )}
                <div data-play style={{opacity: 1}}>
                  <PlayIcon />
                </div>
              </PlayButton>
            )}
          </>
        )}
        {!hasPlaybackIds && <NoPlaybackIdNotice asset={asset} readOnly={readOnly} />}
        {error ? (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Text muted>
              <ErrorOutlineIcon style={{marginRight: '0.15em'}} />
              {typeof error === 'object' && 'message' in error && typeof error.message === 'string'
                ? error.message
                : 'Error loading video'}
            </Text>
          </div>
        ) : null}
        {children}
      </Card>

      {dialogState === 'edit-thumbnail' && (
        <EditThumbnailDialog asset={asset} currentTime={media?.currentTime} />
      )}
      {dialogState === 'edit-captions' && <CaptionsDialog asset={asset} />}
      {dialogState === 'mezzanine' && <MezzanineDialog asset={asset} />}
    </>
  )
}

export function assetIsAudio(asset: VideoAssetDocument) {
  return asset.data?.max_stored_resolution === 'Audio only'
}
