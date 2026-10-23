import {expect, test} from 'vitest'

import {playbackPoliciesFor} from './playbackPolicies'

test('a new playback ID offers only the policies the secrets support, signed first', () => {
  expect(playbackPoliciesFor({enableSignedUrls: false, drmConfigId: null})).toEqual(['public'])
  expect(playbackPoliciesFor({enableSignedUrls: true, drmConfigId: 'drm-1'})).toEqual([
    'signed',
    'public',
    'drm',
  ])
})
