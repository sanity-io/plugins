import {describe, expect} from 'vitest'

import {getFields, test} from '../../test/fixtures'
import {imageType} from './index'

describe('imageType', () => {
  test('has the expected name and identifier', () => {
    expect(imageType.name).toBe('image')
    expect(imageType.identifier).toBe('core.image')
  })

  test('returns a result with type named image', ({stubRegistry}) => {
    const result = imageType.schemaType({name: 'image'}, stubRegistry)

    expect(result.name).toBe('image')
  })

  test('default config includes altText and caption fields', ({stubRegistry}) => {
    const fields = getFields(imageType.schemaType({name: 'image'}, stubRegistry))

    expect(fields).toHaveLength(2)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['altText', 'caption'])
  })

  test('altText: false excludes the altText field', ({stubRegistry}) => {
    const fields = getFields(imageType.schemaType({name: 'image', altText: false}, stubRegistry))

    expect(fields).toHaveLength(1)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['caption'])
  })

  test('caption: false excludes the caption field', ({stubRegistry}) => {
    const fields = getFields(imageType.schemaType({name: 'image', caption: false}, stubRegistry))

    expect(fields).toHaveLength(1)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['altText'])
  })

  test('both altText and caption disabled leaves no fields', ({stubRegistry}) => {
    const fields = getFields(
      imageType.schemaType({name: 'image', altText: false, caption: false}, stubRegistry),
    )

    expect(fields).toHaveLength(0)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual([])
  })

  test('hotspot is enabled by default', ({stubRegistry}) => {
    const typeDef = imageType.schemaType({name: 'image'}, stubRegistry)

    expect(typeDef).toHaveProperty('options.hotspot', true)
  })

  test('hotspot: false disables hotspot on the image type', ({stubRegistry}) => {
    const typeDef = imageType.schemaType({name: 'image', hotspot: false}, stubRegistry)

    expect(typeDef).toHaveProperty('options.hotspot', false)
  })

  test('user-provided fields are appended', ({stubRegistry}) => {
    const result = imageType.schemaType(
      {
        name: 'image',
        fields: [{name: 'credit', type: 'string', title: 'Credit'}],
      },
      stubRegistry,
    )
    const fields = getFields(result)

    expect(fields).toHaveLength(3)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['altText', 'caption', 'credit'])
  })
})

describe('imageType preview.select', () => {
  test('selects altText as title by default', ({stubRegistry}) => {
    const typeDef = imageType.schemaType({name: 'image'}, stubRegistry)
    const select = 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      title: 'altText',
    })
  })

  test('selects caption as title when altText is disabled', ({stubRegistry}) => {
    const typeDef = imageType.schemaType({name: 'image', altText: false}, stubRegistry)
    const select = 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      title: 'caption',
    })
  })

  test('selects filename as title when altText and caption are disabled', ({stubRegistry}) => {
    const typeDef = imageType.schemaType(
      {name: 'image', altText: false, caption: false},
      stubRegistry,
    )
    const select = 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      title: 'asset.originalFilename',
    })
  })
})
