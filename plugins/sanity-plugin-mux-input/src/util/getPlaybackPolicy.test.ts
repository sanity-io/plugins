import {expect, test} from 'vitest'

import {playbackIdToKeep} from './getPlaybackPolicy'

test('the top-level playback ID follows the ones Mux still has', () => {
  const ids = [{id: 'signed-1'}, {id: 'public-1'}]
  expect(playbackIdToKeep('public-1', ids)).toBe('public-1')
  // Deleted, say by Robots moderate, then a new one added in Mux.
  expect(playbackIdToKeep('deleted', ids)).toBe('signed-1')
  expect(playbackIdToKeep(undefined, ids)).toBe('signed-1')
  expect(playbackIdToKeep('deleted', [])).toBeUndefined()
  expect(playbackIdToKeep('deleted', undefined)).toBeUndefined()
})
