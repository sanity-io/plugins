import type {MuxTextTrack} from './types'

type TrackLike = {type?: string; text_type?: string; status?: string}

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
