import {LexoRank} from '@sanity/lexorank'
import {describe, expect, it} from 'vitest'

import {generateMultipleOrderRanks} from './generateMultipleOrderRanks'

describe('generateMultipleOrderRanks', () => {
  it('generates ordered compatible ranks within the legacy bounds', () => {
    const ranks = generateMultipleOrderRanks(7)
    const strings = ranks.map((rank) => rank.toString())

    expect(strings).toEqual([...strings].sort())
    expect(strings.every((rank) => LexoRank.parse(rank).toString() === rank)).toBe(true)
    expect(strings[0]! > LexoRank.min().toString()).toBe(true)
    expect(strings.at(-1)! < LexoRank.max().toString()).toBe(true)
  })

  it('generates ranks between stored boundary values', () => {
    const start = LexoRank.parse('0|100000:')
    const end = LexoRank.parse('0|y00000:')
    const ranks = generateMultipleOrderRanks(5, start, end)
    const strings = ranks.map((rank) => rank.toString())

    expect(strings[0]).toBe(start.toString())
    expect(strings.at(-1)).toBe(end.toString())
    expect(strings).toEqual([...strings].sort())
  })
})
