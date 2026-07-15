import {describe, expect, it} from 'vitest'

import {derivePickerItems} from './deriveItems'
import type {PickerItemMetadata} from './types'

function member(name: string) {
  return {name}
}

const metadata: readonly PickerItemMetadata[] = [
  {
    description: 'Syntax-highlighted code sample',
    group: 'Code & API',
    keywords: ['snippet', 'syntax'],
    trigger: '/code',
    type: 'codeBlock',
  },
  {
    group: 'Callouts & cards',
    keywords: ['note', 'warning'],
    trigger: '/callout',
    type: 'callout',
  },
  {group: 'Media', trigger: '/image', type: 'image'},
]

// Schema order deliberately disagrees with the metadata rank so ordering
// assertions can tell the two apart.
const arrayType = {
  jsonType: 'array',
  of: [member('block'), member('image'), member('callout'), member('codeBlock')],
}

describe('derivePickerItems', () => {
  it('returns no items when the array type is missing or not an array', () => {
    expect(derivePickerItems(undefined, metadata)).toEqual([])
    expect(derivePickerItems({jsonType: 'object', of: []}, metadata)).toEqual([])
  })

  it('skips the text block member', () => {
    const items = derivePickerItems(arrayType, metadata)
    expect(items.map((item) => item.id)).not.toContain('block')
    expect(items).toHaveLength(arrayType.of.length - 1)
  })

  it('covers every object member of the array', () => {
    const items = derivePickerItems(arrayType, metadata)
    const ids = items.map((item) => item.id)
    for (const {name} of arrayType.of) {
      if (name === 'block') continue
      expect(ids).toContain(name)
    }
  })

  it('orders items by metadata rank, not schema order', () => {
    const items = derivePickerItems(arrayType, metadata)
    expect(items.map((item) => item.id)).toEqual(['codeBlock', 'callout', 'image'])
  })

  it('appends members without metadata after ranked ones, in schema order', () => {
    const items = derivePickerItems(
      {
        jsonType: 'array',
        of: [member('zzNewBlock'), member('codeBlock'), member('aaNewBlock'), member('callout')],
      },
      metadata,
    )
    expect(items.map((item) => item.id)).toEqual([
      'codeBlock',
      'callout',
      'zzNewBlock',
      'aaNewBlock',
    ])
    // Unknown members are still insertable, just without trigger/keywords.
    expect(items[2]).toMatchObject({
      action: {blockType: 'zzNewBlock', type: 'insertBlock'},
      keywords: undefined,
      trigger: undefined,
    })
  })

  it('attaches triggers, keywords, group, and description from the metadata', () => {
    const items = derivePickerItems(arrayType, metadata)
    const byId = new Map(items.map((item) => [item.id, item]))
    expect(byId.get('codeBlock')).toMatchObject({
      description: 'Syntax-highlighted code sample',
      group: 'Code & API',
      trigger: '/code',
    })
    expect(byId.get('callout')?.keywords).toContain('warning')
    expect(byId.get('image')).toMatchObject({group: 'Media'})
  })

  it('derives bare items in schema order when no metadata is given', () => {
    const items = derivePickerItems(arrayType)
    expect(items.map((item) => item.id)).toEqual(['image', 'callout', 'codeBlock'])
    expect(items[0]).toMatchObject({
      description: undefined,
      group: undefined,
      keywords: undefined,
      trigger: undefined,
    })
  })

  it('produces insertBlock actions targeting the member name, with title left for schema resolution', () => {
    const items = derivePickerItems(arrayType, metadata)
    for (const item of items) {
      expect(item.action).toEqual({blockType: item.id, type: 'insertBlock'})
      // Presentation (title/icon) resolves from the member schema type in
      // BlockInsertPicker, so derived items ship an empty title.
      expect(item.title).toBe('')
    }
  })
})
