import {describe, expect, it} from 'vitest'

import {LexoRank} from './index'

describe('LexoRank compatibility', () => {
  it('preserves the legacy bounds and midpoint', () => {
    expect(LexoRank.min().toString()).toBe('0|000000:')
    expect(LexoRank.middle().toString()).toBe('0|hzzzzz:')
    expect(LexoRank.max().toString()).toBe('0|zzzzzz:')
  })

  it('preserves boundary saturation behavior', () => {
    expect(LexoRank.min().genPrev().toString()).toBe('0|000000:')
    expect(LexoRank.max().genNext().toString()).toBe('0|zzzzzz:')
  })

  it('preserves repeated next-rank generation', () => {
    const expected = [
      '0|000000:',
      '0|100000:',
      '0|100008:',
      '0|10000g:',
      '0|10000o:',
      '0|10000w:',
      '0|100014:',
      '0|10001c:',
    ]

    let rank = LexoRank.min()
    const actual: string[] = []

    for (let index = 0; index < expected.length; index++) {
      actual.push(rank.toString())
      rank = rank.genNext()
    }

    expect(actual).toEqual(expected)
  })

  it.each([
    ['0|000000:', '0|100000:', '0|0i0000:'],
    ['0|100000:', '0|100008:', '0|100004:'],
    ['0|0i0000:', '0|100000:', '0|0r0000:'],
    ['0|hzzzzz:', '0|zzzzzz:', '0|qzzzzz:'],
    ['0|y00000:', '0|zzzzzz:', '0|yzzzzz:'],
  ])('generates the legacy midpoint between %s and %s', (left, right, expected) => {
    const rank = LexoRank.parse(left).between(LexoRank.parse(right))

    expect(rank.toString()).toBe(expected)
    expect(rank.compareTo(LexoRank.parse(left))).toBeGreaterThan(0)
    expect(rank.compareTo(LexoRank.parse(right))).toBeLessThan(0)
  })

  it.each([
    ['0', '1', '0|0i0000:'],
    ['1', '0', '0|0i0000:'],
    ['3', '5', '0|10000o:'],
    ['5', '3', '0|10000o:'],
    ['15', '30', '0|10004s:'],
    ['31', '32', '0|10006s:'],
    ['100', '200', '0|1000x4:'],
    ['200', '100', '0|1000x4:'],
  ])('preserves the upstream move vector %s → %s', (previousSteps, nextSteps, expected) => {
    let previousRank = LexoRank.min()
    for (let index = 0; index < Number(previousSteps); index++) {
      previousRank = previousRank.genNext()
    }

    let nextRank = LexoRank.min()
    for (let index = 0; index < Number(nextSteps); index++) {
      nextRank = nextRank.genNext()
    }

    expect(previousRank.between(nextRank).toString()).toBe(expected)
  })

  it('parses stored ranks and keeps newly inserted ranks lexicographically ordered', () => {
    const storedRanks = ['0|000000:', '0|100000:', '0|100008:', '0|hzzzzz:', '0|zzzzzz:']
    const insertedRank = LexoRank.parse(storedRanks[1]!)
      .between(LexoRank.parse(storedRanks[2]!))
      .toString()

    expect(insertedRank).toBe('0|100004:')
    expect([...storedRanks, insertedRank].sort()).toEqual([
      '0|000000:',
      '0|100000:',
      '0|100004:',
      '0|100008:',
      '0|hzzzzz:',
      '0|zzzzzz:',
    ])
    expect([...storedRanks, insertedRank].map((rank) => LexoRank.parse(rank).toString())).toEqual([
      ...storedRanks,
      insertedRank,
    ])
  })
})
