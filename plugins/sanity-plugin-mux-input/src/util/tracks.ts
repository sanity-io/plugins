import type {MuxTextTrack} from './types'

type TrackLike = {id?: string; type?: string; text_type?: string; status?: string}

/**
 * A caption or subtitle track. A chapters track is a text track too, and must never be listed
 * or counted as captions. Text tracks stored without a `text_type` still count, as they always
 * have.
 */
export function isCaptionTrack(track: TrackLike | undefined): track is MuxTextTrack {
  return track?.type === 'text' && track.text_type !== 'chapters'
}

/** The chapters track Mux keeps next to the captions, e.g. from Robots' generate-chapters. */
export function isChaptersTrack(track: TrackLike | undefined): track is MuxTextTrack {
  return track?.type === 'text' && track.text_type === 'chapters'
}

/** Whether the asset has a caption track a Robots workflow can read. */
export function hasUsableCaptionTrack(tracks: (TrackLike | undefined)[] | undefined): boolean {
  return (tracks ?? []).some(
    (track) => isCaptionTrack(track) && (track.status === 'ready' || track.status === 'preparing'),
  )
}

/** Text and audio tracks reach the player through its manifest, which lists only ready ones. */
function isManifestTrack(track: TrackLike | undefined): track is TrackLike {
  return track?.type === 'text' || track?.type === 'audio'
}

/**
 * Changes when a text or audio track becomes ready or goes away, so a player can reload the
 * manifest that lists them. A track without a status (the primary audio) counts as ready.
 */
export function readyTracksKey(tracks: (TrackLike | undefined)[] | undefined): string {
  return (tracks ?? [])
    .filter((track) => isManifestTrack(track) && (track.status ?? 'ready') === 'ready')
    .map((track) => track?.id)
    .join(',')
}

/** Whether Mux is still preparing a text or audio track, so the asset is worth reading again. */
export function hasPreparingTracks(tracks: (TrackLike | undefined)[] | undefined): boolean {
  return (tracks ?? []).some((track) => isManifestTrack(track) && track.status === 'preparing')
}
