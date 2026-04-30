import {describe, expect} from 'vitest'

import {getField, getFields, test} from '../../test/fixtures'
import {imageType} from './index'

describe('imageType', () => {
  test('has the expected name and identifier', () => {
    expect(imageType.name).toBe('image')
    expect(imageType.defaultName).toBe('imageObject')
    expect(imageType.identifier).toBe('core.image')
  })

  test('returns a result with type named image', ({stubRegistry}) => {
    const result = imageType.schemaType({name: 'image'}, stubRegistry)

    expect(result.name).toBe('image')
  })

  test('default config includes image, altText, and caption fields', ({stubRegistry}) => {
    const fields = getFields(imageType.schemaType({name: 'image'}, stubRegistry))

    expect(fields).toHaveLength(3)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'altText', 'caption'])
  })

  test('altText: false excludes the altText field', ({stubRegistry}) => {
    const fields = getFields(imageType.schemaType({name: 'image', altText: false}, stubRegistry))

    expect(fields).toHaveLength(2)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'caption'])
  })

  test('caption: false excludes the caption field', ({stubRegistry}) => {
    const fields = getFields(imageType.schemaType({name: 'image', caption: false}, stubRegistry))

    expect(fields).toHaveLength(2)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'altText'])
  })

  test('both altText and caption disabled leaves only the image field', ({stubRegistry}) => {
    const fields = getFields(
      imageType.schemaType({name: 'image', altText: false, caption: false}, stubRegistry),
    )

    expect(fields).toHaveLength(1)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image'])
  })

  test('hotspot is enabled by default', ({stubRegistry}) => {
    const fields = getFields(imageType.schemaType({name: 'image'}, stubRegistry))
    const imageField = getField(fields, 'image')

    expect(imageField).toHaveProperty('options.hotspot', true)
  })

  test('hotspot: false disables hotspot on the image field', ({stubRegistry}) => {
    const fields = getFields(imageType.schemaType({name: 'image', hotspot: false}, stubRegistry))
    const imageField = getField(fields, 'image')

    expect(imageField).toHaveProperty('options.hotspot', false)
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

    expect(fields).toHaveLength(4)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'altText', 'caption', 'credit'])
  })
})

describe('imageType preview.select', () => {
  test('selects altText as title by default', ({stubRegistry}) => {
    const typeDef = imageType.schemaType({name: 'image'}, stubRegistry)
    const select = 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      title: 'altText',
      media: 'image',
    })
  })

  test('selects caption as title when altText is disabled', ({stubRegistry}) => {
    const typeDef = imageType.schemaType({name: 'image', altText: false}, stubRegistry)
    const select = 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      title: 'caption',
      media: 'image',
    })
  })

  test('selects filename as title when altText and caption are disabled', ({stubRegistry}) => {
    const typeDef = imageType.schemaType(
      {name: 'image', altText: false, caption: false},
      stubRegistry,
    )
    const select = 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      title: 'image.asset.originalFilename',
      media: 'image',
    })
  })
})
