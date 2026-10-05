import type {
  AdvancedPlaybackPolicy,
  MuxPlaybackId,
  PlaybackPolicy,
  VideoAssetDocument,
} from './types'

/* - Returns the playback id of the asset based on the specified priority.
  By default chooses the "strongest" policy
   - Otherwise, returns the first playback id in the array.
   */
export function getPlaybackId(
  asset: Pick<VideoAssetDocument, 'data'>,
  priority: string[] = ['drm', 'signed', 'public'],
): string {
  try {
    if (!asset) {
      throw new TypeError('Tried to get playback Id with no asset')
    }

    const playbackIds = asset.data?.playback_ids
    if (playbackIds && playbackIds.length > 0) {
      for (const policy of priority) {
        const match = playbackIds.find((entry) => entry.policy === policy)
        if (match) {
          return match.id
        }
      }

      return playbackIds[0]!.id
    }

    throw new TypeError('Missing playbackId')
  } catch (e) {
    console.error('Asset is missing a playbackId', {asset}, e)
    throw e
  }
}

export function getPlaybackPolicy(
  asset: Pick<VideoAssetDocument, 'data' | 'playbackId'>,
): MuxPlaybackId | undefined {
  return (
    asset.data?.playback_ids?.find(
      (playbackId) => getPlaybackId(asset, ['drm', 'signed', 'public']) === playbackId.id,
    ) ?? {id: '', policy: 'public'}
  )
}

/**
 * Frontends query the document's top-level `playbackId`, so a deleted id (Robots `moderate`
 * deletes them all) would keep failing after playback is restored.
 */
export function playbackIdToKeep(
  current: string | undefined,
  playbackIds: Pick<MuxPlaybackId, 'id'>[] | undefined,
): string | undefined {
  const ids = (playbackIds ?? []).map((entry) => entry.id)
  return current && ids.includes(current) ? current : ids[0]
}

export function getPlaybackPolicyById(
  asset: Pick<VideoAssetDocument, 'data'>,
  playbackId: string,
): MuxPlaybackId | undefined {
  return asset.data?.playback_ids?.find((entry) => playbackId === entry.id)
}

export function hasPlaybackPolicy(
  data: Partial<{
    playback_policy?: PlaybackPolicy[]
    advanced_playback_policies: AdvancedPlaybackPolicy[]
  }>,
  policy: PlaybackPolicy,
) {
  return (
    (data.advanced_playback_policies &&
      data.advanced_playback_policies.find((p) => p.policy === policy)) ||
    data.playback_policy?.find((p) => p === policy)
  )
}
