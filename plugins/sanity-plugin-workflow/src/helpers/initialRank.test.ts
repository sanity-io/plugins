import {LexoRank} from '@sanity/lexorank'
import {describe, expect, it} from 'vitest'

import initialRank from './initialRank'

describe('initialRank', () => {
  it('preserves the legacy default rank', () => {
    expect(initialRank()).toBe('0|100008:')
  })

  it('generates a compatible rank after a stored rank', () => {
    const storedRank = LexoRank.middle().toString()
    const rank = initialRank(storedRank)

    expect(rank > storedRank).toBe(true)
    expect(LexoRank.parse(rank).toString()).toBe(rank)
  })
})
