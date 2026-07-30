// oxlint-disable typescript/no-unsafe-type-assertion - legacy code will be lint-cleaned in a follow-up PR
// @vitest-environment node

import {describe, expect, it} from 'vitest'

import {selectCombinedItems} from './selectors'
import type {RootReducerState} from './types'

describe('selectCombinedItems', () => {
  it('places upload items before asset items', () => {
    const state = {
      assets: {allIds: ['a1', 'a2']},
      uploads: {allIds: ['u1']},
    } as RootReducerState

    expect(selectCombinedItems(state)).toEqual([
      {id: 'u1', type: 'upload'},
      {id: 'a1', type: 'asset'},
      {id: 'a2', type: 'asset'},
    ])
  })
})
