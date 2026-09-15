import {LexoRank} from '@sanity/lexorank'
import {describe, expect, it} from 'vitest'

import type {SanityDocumentWithOrder} from '../../types'
import {ORDER_FIELD_NAME} from '../constants'
import {reorderDocuments} from '../reorderDocuments'

function createDocument(id: string, orderRank: string): SanityDocumentWithOrder {
  return {
    _id: id,
    _type: 'orderableCategory',
    orderRank,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _rev: '1',
  }
}

describe('reorderDocuments', () => {
  it('handles non-string orderRank values without throwing', () => {
    const entities: SanityDocumentWithOrder[] = [
      {
        _id: 'a',
        _type: 'orderableCategory',
        orderRank: '0|00000a:',
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
        _rev: '1',
      },
      {
        _id: 'b',
        _type: 'orderableCategory',
        // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
        orderRank: 1 as unknown as SanityDocumentWithOrder['orderRank'],
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
        _rev: '1',
      },
    ]

    const action = () =>
      reorderDocuments({
        entities: [...entities],
        selectedIds: ['b'],
        source: {index: 1, droppableId: 'documentSortZone'},
        destination: {index: 0, droppableId: 'documentSortZone'},
      })

    expect(action).not.toThrow()

    const result = action()
    const updatedRank = result.patches.find(([id]) => id === 'b')?.[1].set?.[ORDER_FIELD_NAME]

    expect(typeof updatedRank).toBe('string')
    if (typeof updatedRank !== 'string') {
      throw new Error('Expected reordered rank to be a string')
    }
    expect(() => LexoRank.parse(updatedRank)).not.toThrow()
  })

  it('assigns ordered compatible ranks when moving multiple documents', () => {
    const ranks = [
      LexoRank.min().genNext(),
      LexoRank.min().genNext().genNext(),
      LexoRank.middle(),
      LexoRank.max().genPrev(),
    ]
    const entities = ranks.map((rank, index) => createDocument(String(index), rank.toString()))

    const result = reorderDocuments({
      entities,
      selectedIds: ['0', '1'],
      source: {index: 0, droppableId: 'documentSortZone'},
      destination: {index: 3, droppableId: 'documentSortZone'},
    })

    const patchedRanks = result.patches.map(([, patch]) => patch.set?.[ORDER_FIELD_NAME])
    expect(patchedRanks).toHaveLength(2)
    expect(patchedRanks.every((rank) => typeof rank === 'string')).toBe(true)

    const stringRanks = patchedRanks.filter((rank): rank is string => typeof rank === 'string')
    const [firstRank, secondRank] = stringRanks
    if (firstRank === undefined || secondRank === undefined) {
      throw new Error('Expected two reordered ranks')
    }
    expect(firstRank < secondRank).toBe(true)
    expect(firstRank > ranks[3]!.toString()).toBe(true)
    expect(stringRanks.every((rank) => LexoRank.parse(rank).toString() === rank)).toBe(true)
    expect(result.newOrder.map((document) => document._id)).toEqual(['2', '3', '0', '1'])
  })
})
