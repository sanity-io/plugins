import type {SanityClient} from 'sanity'

import {getMuxAddonClient} from '../util/muxAddonClient'
import {PLUGIN_VERSION_QUERY} from '../util/pluginVersion'
import type {MuxAsset, MuxPlaybackId, PlaybackPolicy, VideoAssetDocument} from '../util/types'
import {toRobotsRequestError} from './robots'

export function deleteAssetOnMux(client: SanityClient, assetId: string) {
  const {dataset} = client.config()
  return getMuxAddonClient(client).request<void>({
    url: `/addons/mux/assets/${dataset}/${assetId}`,
    withCredentials: true,
    method: 'DELETE',
    query: PLUGIN_VERSION_QUERY,
  })
}

export async function deleteAsset({
  client,
  asset,
  deleteOnMux,
}: {
  client: SanityClient
  asset: VideoAssetDocument
  deleteOnMux: boolean
}) {
  if (!asset?._id) return true

  try {
    await client.delete(asset._id)
  } catch {
    return 'failed-sanity'
  }

  if (deleteOnMux && asset?.assetId) {
    try {
      await deleteAssetOnMux(client, asset.assetId)
    } catch {
      return 'failed-mux'
    }
  }

  return true
}

export function getAsset(client: SanityClient, assetId: string) {
  const {dataset} = client.config()
  return getMuxAddonClient(client).request<{data: MuxAsset}>({
    url: `/addons/mux/assets/${dataset}/data/${assetId}`,
    withCredentials: true,
    method: 'GET',
    query: PLUGIN_VERSION_QUERY,
  })
}

export function listAssets(
  client: SanityClient,
  options: {limit?: number; cursor?: string | null},
) {
  const {dataset} = client.config()
  const query: {limit?: string; cursor?: string} = {}

  if (options.limit) {
    query.limit = options.limit.toString()
  }
  if (options.cursor) {
    query.cursor = options.cursor
  }

  return getMuxAddonClient(client).request<{data: MuxAsset[]; next_cursor?: string | null}>({
    url: `/addons/mux/assets/${dataset}/data/list`,
    withCredentials: true,
    method: 'GET',
    query: {...query, ...PLUGIN_VERSION_QUERY},
  })
}

/**
 * Adds a new text track to an existing asset using a VTT file URL
 */
export function addTextTrackFromUrl(
  client: SanityClient,
  assetId: string,
  vttUrl: string,
  options: {
    language_code: string
    name: string
    text_type?: 'subtitles' | 'chapters'
  },
) {
  const {dataset} = client.config()

  return getMuxAddonClient(client).request<{data: MuxAsset}>({
    url: `/addons/mux/assets/${dataset}/${assetId}/tracks`,
    withCredentials: true,
    method: 'POST',
    body: {
      url: vttUrl,
      type: 'text',
      language_code: options.language_code,
      name: options.name,
      text_type: options.text_type || 'subtitles',
    },
    headers: {
      'Content-Type': 'application/json',
    },
    query: PLUGIN_VERSION_QUERY,
  })
}

/**
 * Generates subtitles automatically for an audio track
 */
export function generateSubtitles(
  client: SanityClient,
  assetId: string,
  audioTrackId: string,
  options: {
    language_code: string
    name: string
  },
) {
  const {dataset} = client.config()
  return getMuxAddonClient(client).request<{data: MuxAsset}>({
    url: `/addons/mux/assets/${dataset}/${assetId}/tracks/${audioTrackId}/generate-subtitles`,
    withCredentials: true,
    method: 'POST',
    body: {
      generated_subtitles: [
        {
          language_code: options.language_code,
          name: options.name,
        },
      ],
    },
    headers: {
      'Content-Type': 'application/json',
    },
    query: PLUGIN_VERSION_QUERY,
  })
}

/**
 * Deletes a text track from an asset
 */
export function deleteTextTrack(client: SanityClient, assetId: string, trackId: string) {
  const {dataset} = client.config()
  return getMuxAddonClient(client).request<{data: MuxAsset}>({
    url: `/addons/mux/assets/${dataset}/${assetId}/tracks/${trackId}`,
    withCredentials: true,
    method: 'DELETE',
    query: PLUGIN_VERSION_QUERY,
  })
}

/**
 * Updates master access (the "mezzanine" file in Mux's docs) on a Mux asset, via the addon proxy.
 * @see {@link https://docs.mux.com/api-reference/video/assets/update-asset-master-access}
 */
export function updateMasterAccess(
  client: SanityClient,
  assetId: string,
  masterAccess: 'temporary' | 'none',
) {
  const {dataset} = client.config()
  return getMuxAddonClient(client).request<{data: MuxAsset}>({
    url: `/addons/mux/assets/${dataset}/${assetId}/master-access`,
    withCredentials: true,
    method: 'PUT',
    body: {master_access: masterAccess},
    headers: {
      'Content-Type': 'application/json',
    },
    query: PLUGIN_VERSION_QUERY,
  })
}

/**
 * Creates a playback ID, e.g. after Robots `moderate` deleted them all. The proxy answers like
 * the Robots routes, so failures are `RobotsRequestError`s; a 404 without `mux` means the proxy
 * doesn't have the route yet.
 */
export async function createPlaybackId(
  client: SanityClient,
  assetId: string,
  policy: PlaybackPolicy,
  drmConfigurationId?: string,
) {
  const {dataset} = client.config()
  try {
    return await getMuxAddonClient(client).request<{data: MuxPlaybackId}>({
      url: `/addons/mux/assets/${dataset}/${assetId}/playback-ids`,
      withCredentials: true,
      method: 'POST',
      body: policy === 'drm' ? {policy, drm_configuration_id: drmConfigurationId} : {policy},
      headers: {'Content-Type': 'application/json'},
      query: PLUGIN_VERSION_QUERY,
    })
  } catch (error) {
    throw toRobotsRequestError(error)
  }
}
