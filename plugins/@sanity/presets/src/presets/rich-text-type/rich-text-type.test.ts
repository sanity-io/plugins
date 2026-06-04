import type {FieldDefinition, SchemaTypeDefinition} from 'sanity'
import {describe, expect, vi} from 'vitest'

import type {RegistryContext} from '../../definePresetType'
import {test} from '../../test/fixtures'
import {richTextType} from './index'

type Member = Record<string, unknown>

interface BlockMember extends Member {
  marks?: {
    annotations?: Member[]
  }
  of?: Member[]
}

/**
 * Stub `RegistryContext` whose `getPreset` tags the returned field with
 * `__preset` so tests can assert which preset resolved.
 */
function makeStubRegistry(): RegistryContext & {
  getPreset: ReturnType<typeof vi.fn>
} {
  const getPreset = vi.fn((presetName: string, presetConfig?: Record<string, unknown>) => {
    const name = typeof presetConfig?.['name'] === 'string' ? presetConfig['name'] : presetName
    return {name, type: 'object', fields: [], __preset: presetName} as SchemaTypeDefinition &
      FieldDefinition
  })
  return {getPreset}
}

function getOf(typeDef: SchemaTypeDefinition): Member[] {
  if (!('of' in typeDef) || !typeDef.of) {
    throw new Error('Expected an array type definition with an of array')
  }
  // oxlint-disable-next-line no-unsafe-type-assertion -- test helper narrows to stub shape
  return typeDef.of as unknown as Member[]
}

function getBlock(typeDef: SchemaTypeDefinition): BlockMember {
  const block = getOf(typeDef).find((member) => member['type'] === 'block')
  if (!block) {
    throw new Error('Expected a block member in the array')
  }
  // oxlint-disable-next-line no-unsafe-type-assertion -- test helper narrows to stub shape
  return block as unknown as BlockMember
}

describe('richTextType', () => {
  test('has the expected name and identifier', () => {
    expect(richTextType.name).toBe('richText')
    expect(richTextType.identifier).toBe('core.richText')
  })

  test('returns an array schema type named richText', () => {
    const result = richTextType.schemaType({name: 'richText'}, makeStubRegistry())

    expect(result.name).toBe('richText')
    expect(result.type).toBe('array')
  })

  test('defaults to embedding link as annotation, image as block, and cta as inline object', () => {
    const typeDef = richTextType.schemaType({name: 'richText'}, makeStubRegistry())
    const block = getBlock(typeDef)
    const ofMembers = getOf(typeDef)

    expect(block.marks?.annotations?.[0]).toMatchObject({__preset: 'link', name: 'link'})
    expect(block.of?.[0]).toMatchObject({__preset: 'cta', name: 'cta'})
    expect(ofMembers).toHaveLength(2)
    expect(ofMembers[0]).toHaveProperty('type', 'block')
    expect(ofMembers[1]).toMatchObject({__preset: 'image', name: 'richTextImage'})
  })

  test('objects: {image: false, cta: false} disables image and inline cta but keeps link', () => {
    const typeDef = richTextType.schemaType(
      {name: 'richText', objects: {image: false, cta: false}},
      makeStubRegistry(),
    )
    const block = getBlock(typeDef)
    const ofMembers = getOf(typeDef)

    expect(block.of).toBeUndefined()
    expect(ofMembers).toHaveLength(1)
    expect(ofMembers[0]).toHaveProperty('type', 'block')
    expect(block.marks?.annotations?.[0]).toMatchObject({__preset: 'link'})
  })

  test('objects: false disables every embedded object', () => {
    const typeDef = richTextType.schemaType({name: 'richText', objects: false}, makeStubRegistry())
    const block = getBlock(typeDef)
    const ofMembers = getOf(typeDef)

    expect(block.marks?.annotations).toEqual([])
    expect(block.of).toBeUndefined()
    expect(ofMembers).toHaveLength(1)
  })

  test('objects: {link: false} disables only the link annotation', () => {
    const typeDef = richTextType.schemaType(
      {name: 'richText', objects: {link: false}},
      makeStubRegistry(),
    )
    const block = getBlock(typeDef)
    const ofMembers = getOf(typeDef)

    expect(block.marks?.annotations).toEqual([])
    expect(block.of?.[0]).toMatchObject({__preset: 'cta'})
    expect(ofMembers[1]).toMatchObject({__preset: 'image'})
  })

  test('name and title override defaults', () => {
    const typeDef = richTextType.schemaType({name: 'body', title: 'Body'}, makeStubRegistry())

    expect(typeDef.name).toBe('body')
    expect(typeDef).toHaveProperty('title', 'Body')
  })
})

describe('richTextType via the registry', () => {
  test('defineRichText resolves link, image, and cta fields from the registry', ({registry}) => {
    const result = registry.defineRichText({name: 'body'})
    const ofMembers = getOf(result)
    const block = getBlock(result)

    expect(ofMembers).toHaveLength(2)
    expect(ofMembers[0]).toHaveProperty('type', 'block')
    expect(ofMembers[1]).toMatchObject({
      name: 'richTextImage',
      type: 'image',
      fields: expect.arrayContaining([expect.objectContaining({name: 'altText'})]),
    })
    expect(block.marks?.annotations?.[0]).toMatchObject({
      name: 'link',
      fields: expect.arrayContaining([expect.objectContaining({name: 'linkType'})]),
    })
    expect(block.of?.[0]).toMatchObject({
      name: 'cta',
      fields: expect.arrayContaining([expect.objectContaining({name: 'link'})]),
    })
  })

  describe('with registry-level to', () => {
    test.override('registryConfig', {link: {to: ['marketingPage']}})

    test('link annotations inherit to from registry config', ({registry}) => {
      const result = registry.defineRichText({name: 'body'})
      const block = getBlock(result)

      expect(block.marks?.annotations?.[0]).toMatchObject({
        name: 'link',
        fields: expect.arrayContaining([
          expect.objectContaining({name: 'reference', to: [{type: 'marketingPage'}]}),
        ]),
      })
    })
  })
})

describe('richTextType map hooks', () => {
  test('map.of transforms the final of array', ({registry}) => {
    const result = registry.defineRichText({
      name: 'body',
      map: {
        of: (members = []) => members.filter((member) => member.type === 'block'),
      },
    })
    const ofMembers = getOf(result)

    expect(ofMembers).toHaveLength(1)
    expect(ofMembers[0]).toHaveProperty('type', 'block')
  })
})
