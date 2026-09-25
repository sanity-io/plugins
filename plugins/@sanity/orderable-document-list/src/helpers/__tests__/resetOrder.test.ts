import type {SanityClient} from '@sanity/client'
import {LexoRank} from '@sanity/lexorank'
import {describe, expect, it, vi} from 'vitest'

import {ORDER_FIELD_NAME} from '../constants'
import {resetOrder} from '../resetOrder'

describe('resetOrder', () => {
  it('writes deterministic compatible ranks in document order', async () => {
    const patches: Array<{id: string; rank: unknown}> = []
    const transaction = {
      patch: vi.fn((id: string, patch: {set?: Record<string, unknown>}) => {
        patches.push({id, rank: patch.set?.[ORDER_FIELD_NAME]})
        return transaction
      }),
      commit: vi.fn().mockResolvedValue({transactionId: 'reset-order'}),
    }
    const client = {
      fetch: vi.fn().mockResolvedValue([
        {_id: 'first', _type: 'orderableCategory', orderRank: 'legacy'},
        {_id: 'second', _type: 'orderableCategory', orderRank: 'legacy'},
        {_id: 'third', _type: 'orderableCategory', orderRank: 'legacy'},
      ]),
      transaction: vi.fn(() => transaction),
    }

    await resetOrder({
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      client: client as unknown as SanityClient,
      type: 'orderableCategory',
    })

    expect(patches).toEqual([
      {id: 'first', rank: '0|100008:'},
      {id: 'second', rank: '0|10000o:'},
      {id: 'third', rank: '0|100014:'},
    ])
    expect(
      patches.every(({rank}) =>
        typeof rank === 'string' ? LexoRank.parse(rank).toString() === rank : false,
      ),
    ).toBe(true)
    expect(transaction.commit).toHaveBeenCalledWith({
      visibility: 'async',
      tag: 'orderable-document-list.reset-order',
    })
  })
})
