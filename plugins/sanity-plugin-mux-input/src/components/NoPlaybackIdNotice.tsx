import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Button, Flex, Select, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useState} from 'react'

import {createPlaybackId} from '../actions/assets'
import {RobotsRequestError} from '../actions/robots'
import {useClient} from '../hooks/useClient'
import {useResyncAsset} from '../hooks/useResyncAsset'
import {useSecretsDocumentValues} from '../hooks/useSecretsDocumentValues'
import {ROBOTS_DASHBOARD_URL} from '../robots/capability'
import {playbackPoliciesFor} from '../util/playbackPolicies'
import type {PlaybackPolicy, VideoAssetDocument} from '../util/types'

const POLICY_LABELS: Record<PlaybackPolicy, string> = {
  public: 'Public',
  signed: 'Signed',
  drm: 'DRM',
}

function DashboardFallback() {
  return (
    <Text size={1} muted>
      Add a playback ID to this asset in the{' '}
      <a href={ROBOTS_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
        Mux dashboard
      </a>
      , then resync the video.
    </Text>
  )
}

type Toast = Parameters<ReturnType<typeof useToast>['push']>[0]

/** Outside the component: React Compiler doesn't compile `try`/`finally`. */
async function createAndResync(
  run: () => Promise<unknown>,
): Promise<{toast: Toast; isRouteMissing?: boolean}> {
  try {
    // The player comes back once the resync writes the new playback ID to the document.
    const refreshed = await run()
    return {
      toast: refreshed
        ? {status: 'success', title: 'Playback ID created'}
        : {
            status: 'warning',
            title: 'Playback ID created',
            description: 'Resync the video to play it here.',
          },
    }
  } catch (error) {
    return {
      // The proxy answered without the route: only the dashboard can help.
      isRouteMissing:
        error instanceof RobotsRequestError && error.status === 404 && !error.muxAnswered,
      toast: {
        status: 'error',
        title: 'Could not create a playback ID',
        ...(error instanceof Error && {description: error.message}),
      },
    }
  }
}

/** Shown in place of the player. Robots `moderate` can delete every playback ID. */
export function NoPlaybackIdNotice({
  asset,
  readOnly,
}: {
  asset: VideoAssetDocument
  readOnly?: boolean
}) {
  const client = useClient()
  const toast = useToast()
  const {secrets} = useSecretsDocumentValues().value
  const {resyncAsset} = useResyncAsset()
  const policies = playbackPoliciesFor(secrets)
  const [chosenPolicy, setChosenPolicy] = useState<PlaybackPolicy>()
  const policy = chosenPolicy && policies.includes(chosenPolicy) ? chosenPolicy : policies[0]!
  const [isCreating, setIsCreating] = useState(false)
  const [isRouteMissing, setIsRouteMissing] = useState(false)

  const create = async () => {
    const {assetId} = asset
    if (!assetId) return
    setIsCreating(true)
    const outcome = await createAndResync(() =>
      createPlaybackId(client, assetId, policy, secrets.drmConfigId ?? undefined).then(() =>
        resyncAsset(asset),
      ),
    )
    setIsCreating(false)
    if (outcome.isRouteMissing) setIsRouteMissing(true)
    toast.push(outcome.toast)
  }

  return (
    <Flex
      align="center"
      justify="center"
      padding={4}
      style={{position: 'absolute', inset: 0, overflow: 'auto'}}
    >
      <Stack gap={3} style={{maxWidth: '30rem'}}>
        <Text size={1} weight="semibold">
          <WarningOutlineIcon style={{marginRight: '0.25em'}} />
          This video has no playback ID
        </Text>
        <Text size={1} muted>
          It can’t play here or wherever it’s embedded. Robots Moderate deletes playback IDs when it
          flags content, and they can also be removed in Mux.
        </Text>
        {readOnly || isRouteMissing ? (
          <DashboardFallback />
        ) : (
          <Flex gap={2} align="center" wrap="wrap">
            <Box flex={1}>
              <Select
                aria-label="Policy of the new playback ID"
                fontSize={1}
                padding={2}
                value={policy}
                disabled={isCreating}
                onChange={(event) => setChosenPolicy(event.currentTarget.value as PlaybackPolicy)}
              >
                {policies.map((option) => (
                  <option key={option} value={option}>
                    {POLICY_LABELS[option]}
                  </option>
                ))}
              </Select>
            </Box>
            <Button
              text="Create playback ID"
              tone="primary"
              fontSize={1}
              padding={2}
              loading={isCreating}
              disabled={!asset.assetId}
              onClick={() => void create()}
            />
          </Flex>
        )}
      </Stack>
    </Flex>
  )
}
