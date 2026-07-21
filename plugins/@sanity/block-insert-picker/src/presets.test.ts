// Member types are structural stubs of compiled schema types; the casts hand
// them to the PickerItemsContext-typed parameter.
// oxlint-disable no-unsafe-type-assertion
import {describe, expect, it} from 'vitest'

import {CODE_FENCE_PATTERN} from './inputRules'
import {applyPresetMetadata, standardBlockPresets, wellKnownInputRules} from './presets'
import type {PickerItem, PickerItemsContext} from './types'

function makeContext(
  members: ReadonlyArray<{name: string; type?: {name: string; type?: unknown}}>,
): PickerItemsContext {
  return {
    memberTypes: members,
    schemaType: {jsonType: 'array', name: 'testContent', of: members},
  } as unknown as PickerItemsContext
}

function insertItem(blockType: string, partial?: Partial<PickerItem>): PickerItem {
  return {
    action: {blockType, type: 'insertBlock'},
    id: blockType,
    title: '',
    ...partial,
  }
}

const imagePreset = standardBlockPresets.find((preset) => preset.type === 'image')!

describe('applyPresetMetadata', () => {
  it('matches presets through the resolved type chain for aliased members', () => {
    const context = makeContext([{name: 'photo', type: {name: 'image', type: {name: 'object'}}}])
    const [item] = applyPresetMetadata([insertItem('photo')], context)
    expect(item).toMatchObject({
      keywords: imagePreset.keywords,
      trigger: imagePreset.trigger,
    })
  })

  it('fills only the missing fields, keeping curated metadata', () => {
    const context = makeContext([{name: 'image'}])
    const [item] = applyPresetMetadata([insertItem('image', {trigger: '/pic'})], context)
    expect(item).toMatchObject({keywords: imagePreset.keywords, trigger: '/pic'})
  })

  it('leaves items untouched when both trigger and keywords are curated', () => {
    const context = makeContext([{name: 'image'}])
    const curated = insertItem('image', {keywords: ['pix'], trigger: '/pic'})
    const [item] = applyPresetMetadata([curated], context)
    expect(item).toBe(curated)
  })

  it('leaves custom-action items and unknown members untouched', () => {
    const context = makeContext([{name: 'callout'}])
    const custom: PickerItem = {
      action: {onSelect: () => {}, type: 'custom'},
      id: 'command',
      title: 'Command',
    }
    const unknown = insertItem('callout')
    expect(applyPresetMetadata([custom, unknown], context)).toEqual([custom, unknown])
  })
})

describe('wellKnownInputRules', () => {
  it('ships a code fence for @sanity/code-input that stores the typed token', () => {
    expect(wellKnownInputRules).toHaveLength(1)
    const fence = wellKnownInputRules[0]!
    expect(fence.blockType).toBe('code')
    expect(fence.pattern).toBe(CODE_FENCE_PATTERN)
    const keyGenerator = () => 'key'
    expect(fence.buildValue({keyGenerator, matchText: '```ts '})).toEqual({language: 'ts'})
    // No fence token: nothing stored, code-input's own defaults apply.
    expect(fence.buildValue({keyGenerator, matchText: '``` '})).toEqual({})
  })
})
