// oxlint-disable typescript/no-unsafe-type-assertion - legacy code will be lint-cleaned in a follow-up PR
import {describe, expect, it} from 'vitest'

import type {ImageAsset} from '../types'
import getAssetResolution from './getAssetResolution'

describe('getAssetResolution', () => {
  it('formats width x height with px suffix', () => {
    const asset = {
      metadata: {dimensions: {width: 1920, height: 1080}},
    } as ImageAsset
    expect(getAssetResolution(asset)).toBe('1920x1080px')
  })
})
