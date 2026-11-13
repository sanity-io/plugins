import type {DragEvent} from 'react'
import {describe, expect, it} from 'vitest'

import {ASSET_DRAG_TYPE, getDragAssetIds, isAssetDrag, setDragAssetIds} from './assetDrag'

function createDragEvent(data: Record<string, string> = {}) {
  const store = {...data}
  const dataTransfer = {
    effectAllowed: 'none',
    getData: (type: string) => store[type] ?? '',
    setData: (type: string, value: string) => {
      store[type] = value
    },
    get types() {
      return Object.keys(store)
    },
  }
  return {dataTransfer} as unknown as DragEvent
}

describe('assetDrag', () => {
  it('round-trips asset ids through the drag event', () => {
    const event = createDragEvent()
    setDragAssetIds(event, ['a', 'b'])

    expect(event.dataTransfer.effectAllowed).toBe('move')
    expect(isAssetDrag(event)).toBe(true)
    expect(getDragAssetIds(event)).toEqual(['a', 'b'])
  })

  it('ignores file drags', () => {
    const event = createDragEvent({Files: ''})

    expect(isAssetDrag(event)).toBe(false)
    expect(getDragAssetIds(event)).toEqual([])
  })

  it('returns an empty list for malformed payloads', () => {
    expect(getDragAssetIds(createDragEvent({[ASSET_DRAG_TYPE]: 'not json'}))).toEqual([])
    expect(getDragAssetIds(createDragEvent({[ASSET_DRAG_TYPE]: '{"a":1}'}))).toEqual([])
    expect(getDragAssetIds(createDragEvent({[ASSET_DRAG_TYPE]: '["a",1,null]'}))).toEqual(['a'])
  })
})
