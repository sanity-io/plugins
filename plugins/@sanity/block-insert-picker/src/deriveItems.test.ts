// Member types are structural stubs of compiled schema types; the casts hand
// them to the PickerItemsContext-typed parameter.
// oxlint-disable no-unsafe-type-assertion
import {describe, expect, it} from 'vitest'

import {derivePickerItems, typeNameChain, unknownMetadataTypes} from './deriveItems'
import type {PickerItemMetadata, PickerItemsContext} from './types'

type MemberStub = {name: string; type?: {name: string; type?: unknown}}

function makeContext(members: readonly MemberStub[]): PickerItemsContext {
  return {
    memberTypes: members,
    schemaType: {jsonType: 'array', name: 'testContent', of: members},
  } as unknown as PickerItemsContext
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
// assertions can tell the two apart. The text block never reaches
// derivePickerItems — usePickerItemsContext excludes it (see
// memberSchemaTypes) and the context's blockObjects never contain it.
const context = makeContext([{name: 'image'}, {name: 'callout'}, {name: 'codeBlock'}])

describe('derivePickerItems', () => {
  it('returns no items for an array with no insertable members', () => {
    expect(derivePickerItems(makeContext([]), metadata)).toEqual([])
  })

  it('covers every insertable member of the array', () => {
    const items = derivePickerItems(context, metadata)
    const ids = items.map((item) => item.id)
    for (const {name} of context.memberTypes) {
      expect(ids).toContain(name)
    }
  })

  it('orders items by metadata rank, not schema order', () => {
    const items = derivePickerItems(context, metadata)
    expect(items.map((item) => item.id)).toEqual(['codeBlock', 'callout', 'image'])
  })

  it('appends members without metadata after ranked ones, in schema order', () => {
    const items = derivePickerItems(
      makeContext([
        {name: 'zzNewBlock'},
        {name: 'codeBlock'},
        {name: 'aaNewBlock'},
        {name: 'callout'},
      ]),
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
    const items = derivePickerItems(context, metadata)
    const byId = new Map(items.map((item) => [item.id, item]))
    expect(byId.get('codeBlock')).toMatchObject({
      description: 'Syntax-highlighted code sample',
      group: 'Code & API',
      trigger: '/code',
    })
    expect(byId.get('callout')?.keywords).toContain('warning')
    expect(byId.get('image')).toMatchObject({group: 'Media'})
  })

  it('attaches badge and openOnInsert from the metadata', () => {
    const items = derivePickerItems(context, [{badge: '⌘⇧C', openOnInsert: false, type: 'callout'}])
    const callout = items.find((item) => item.id === 'callout')
    expect(callout).toMatchObject({badge: '⌘⇧C', openOnInsert: false})
  })

  it('matches aliased members through their resolved type chain', () => {
    const items = derivePickerItems(
      makeContext([{name: 'photo', type: {name: 'image'}}, {name: 'callout'}]),
      metadata,
    )
    // The `image` entry applies to the `photo` member (rank + curation),
    // while the action still targets the member name the array accepts.
    expect(items.map((item) => item.id)).toEqual(['callout', 'photo'])
    expect(items[1]).toMatchObject({
      action: {blockType: 'photo', type: 'insertBlock'},
      group: 'Media',
      trigger: '/image',
    })
  })

  it('prefers a member-name entry over a resolved-chain entry', () => {
    const items = derivePickerItems(makeContext([{name: 'photo', type: {name: 'image'}}]), [
      {trigger: '/image', type: 'image'},
      {trigger: '/photo', type: 'photo'},
    ])
    expect(items[0]).toMatchObject({trigger: '/photo'})
  })

  it('drops members whose metadata marks them hidden', () => {
    const items = derivePickerItems(context, [{hidden: true, type: 'callout'}])
    expect(items.map((item) => item.id)).toEqual(['image', 'codeBlock'])
  })

  it('derives bare items in schema order when no metadata is given', () => {
    const items = derivePickerItems(context)
    expect(items.map((item) => item.id)).toEqual(['image', 'callout', 'codeBlock'])
    expect(items[0]).toMatchObject({
      description: undefined,
      group: undefined,
      keywords: undefined,
      trigger: undefined,
    })
  })

  it('produces insertBlock actions targeting the member name, with title left for schema resolution', () => {
    const items = derivePickerItems(context, metadata)
    for (const item of items) {
      expect(item.action).toEqual({blockType: item.id, type: 'insertBlock'})
      // Presentation (title/icon) resolves from the member schema type in
      // BlockInsertPicker, so derived items ship an empty title.
      expect(item.title).toBe('')
    }
  })
})

describe('typeNameChain', () => {
  it('yields the member name for a plain member', () => {
    expect(typeNameChain({name: 'callout'})).toEqual(['callout'])
  })

  it('walks the compiled type chain most-specific first', () => {
    expect(typeNameChain({name: 'photo', type: {name: 'image', type: {name: 'object'}}})).toEqual([
      'photo',
      'image',
      'object',
    ])
  })
})

describe('unknownMetadataTypes', () => {
  it('flags entries matching neither member names nor resolved chains', () => {
    const unknown = unknownMetadataTypes(
      makeContext([{name: 'photo', type: {name: 'image'}}, {name: 'callout'}]),
      [
        {type: 'image'},
        {type: 'callout'},
        {type: 'calout'}, // typo
      ],
    )
    expect(unknown).toEqual(['calout'])
  })
})
