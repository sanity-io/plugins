import {LexoRank} from 'lexorank'
import {describe, expect, it} from 'vitest'

import type {SanityDocumentWithOrder} from '../../types'
import {ORDER_FIELD_NAME} from '../constants'
import {reorderDocuments} from '../reorderDocuments'

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
})
