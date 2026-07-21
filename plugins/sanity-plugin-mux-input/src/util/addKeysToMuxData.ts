import type {MuxAsset} from './types'

/**
 * Adds a `_key` to array items in MuxAsset data (Sanity requires `_key` on array
 * items). Keys are derived from each item's stable Mux `id`, so repeated calls
 * are idempotent and don't churn the document — important because the asset is
 * persisted on every poll while it prepares.
 */
export function addKeysToMuxData(data: MuxAsset): MuxAsset {
  return {
    ...data,
    tracks: data.tracks?.map((track, index) => ({
      ...track,
      _key: track.id || `track-${index}`,
    })),
    playback_ids: data.playback_ids?.map((playbackId, index) => ({
      ...playbackId,
      _key: playbackId.id || `playback-${index}`,
    })),
    static_renditions: data.static_renditions
      ? {
          ...data.static_renditions,
          files: data.static_renditions.files?.map((file, index) => ({
            ...file,
            _key: file.id || `rendition-${index}`,
          })),
        }
      : undefined,
  }
}
