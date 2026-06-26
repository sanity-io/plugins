import {DownloadIcon} from '@sanity/icons'
import {Button, Card, Flex, Label, Spinner, Stack, Text} from '@sanity/ui'

import {useMezzanine} from '../hooks/useMezzanine'
import {MEZZANINE_LEARN_MORE_URL} from '../util/constants'
import type {VideoAssetDocument} from '../util/types'
import MezzanineExplanation from './MezzanineExplanation'

export interface Props {
  asset: VideoAssetDocument
  /**
   * Render the mezzanine explanation copy inside the card.
   * @defaultValue true
   */
  withExplanation?: boolean
}

/**
 * "Mezzanine" panel, modeled after Mux's dashboard card: enable the
 * master-access copy, watch it prepare, then download it.
 */
export default function Mezzanine({asset, withExplanation = true}: Props) {
  const {status, busy, expired, resolution, enable, download} = useMezzanine(asset)

  const assetReady = asset.status === 'ready' || asset.data?.status === 'ready'
  // Once a download finds the file gone, treat it as not-ready even if the
  // (stale) asset prop still reports `ready`, so we show the re-enable path
  // instead of a dead Download button.
  const isReady = status === 'ready' && !expired
  const isPreparing = status === 'preparing'
  const showExplanation = !isReady && !isPreparing

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={4}>
        <Flex align="center" justify="space-between" gap={3}>
          <Label muted size={1}>
            Mezzanine
          </Label>
          <Text size={1}>
            <a href={MEZZANINE_LEARN_MORE_URL} target="_blank" rel="noopener noreferrer">
              Learn more
            </a>
          </Text>
        </Flex>

        <Stack space={2}>
          <Text size={1} muted={!isReady}>
            mezzanine.mp4
          </Text>
          {resolution && (
            <Text size={1} muted>
              {resolution}
            </Text>
          )}
        </Stack>

        {withExplanation && showExplanation && <MezzanineExplanation />}

        {showExplanation && (expired || status === 'errored') && (
          <Stack space={2}>
            {expired && (
              <Text size={1} muted>
                The previous mezzanine file expired. Enable it again to download.
              </Text>
            )}
            {status === 'errored' && (
              <Text size={1} style={{color: 'var(--card-critical-color)'}}>
                Mux could not prepare the mezzanine file. Please try again.
              </Text>
            )}
          </Stack>
        )}

        {isPreparing && (
          <Text size={1} muted>
            Preparing the mezzanine file… this can take a few minutes. You can close this and come
            back later.
          </Text>
        )}

        {isReady && (
          <Text size={1} muted>
            Ready to download. The link stays available for about 24 hours.
          </Text>
        )}

        <Flex justify="flex-end" gap={2}>
          {isPreparing ? (
            <Flex align="center" gap={2}>
              <Spinner muted size={1} />
              <Text size={1} muted>
                Preparing…
              </Text>
            </Flex>
          ) : isReady ? (
            <Button
              icon={DownloadIcon}
              text="Download"
              tone="positive"
              fontSize={1}
              padding={3}
              loading={busy}
              disabled={busy}
              onClick={() => void download()}
            />
          ) : (
            <Button
              text={status === 'errored' ? 'Try again' : 'Enable'}
              tone="primary"
              fontSize={1}
              padding={3}
              loading={busy}
              disabled={busy || !assetReady}
              onClick={() => void enable()}
            />
          )}
        </Flex>
      </Stack>
    </Card>
  )
}
