import type {PlaybackPolicy, Secrets} from './types'

/**
 * The policies a new playback ID can get with these secrets, the default first: signed when
 * signing keys are set up, since a public ID would expose a video meant to be protected.
 */
export function playbackPoliciesFor(
  secrets: Pick<Secrets, 'enableSignedUrls' | 'drmConfigId'>,
): PlaybackPolicy[] {
  return [
    ...(secrets.enableSignedUrls ? (['signed'] as const) : []),
    'public',
    ...(secrets.drmConfigId ? (['drm'] as const) : []),
  ]
}
