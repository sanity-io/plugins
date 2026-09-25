import {LexoRank} from '@sanity/lexorank'
import {describe, expect, it} from 'vitest'

import {initialRank} from '../initialRank'

describe('initialRank', () => {
  it('handles invalid/non-string compareRankValue without throwing', () => {
    const action = () => initialRank(1)
    expect(action).not.toThrow()

    const rank = action()
    expect(typeof rank).toBe('string')
    expect(() => LexoRank.parse(rank)).not.toThrow()
  })

  it('falls back to LexoRank.min when parse fails', () => {
    const rank = initialRank('not-a-rank', 'after')
    expect(() => LexoRank.parse(rank)).not.toThrow()
  })

  it('preserves the legacy default rank for documents appended to a list', () => {
    expect(initialRank(undefined, 'after')).toBe('0|100008:')
  })

  it('preserves the legacy minimum rank for documents prepended to a list', () => {
    expect(initialRank(undefined, 'before')).toBe('0|000000:')
  })

  it('generates ranks on the requested side of an existing rank', () => {
    const compareRank = LexoRank.middle().toString()

    expect(initialRank(compareRank, 'before') < compareRank).toBe(true)
    expect(initialRank(compareRank, 'after') > compareRank).toBe(true)
  })
})
