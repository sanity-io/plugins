import type {FieldDefinition} from 'sanity'
import {describe, expect} from 'vitest'

import {getField, getFields, test} from '../../test/fixtures'
import {imageType} from './index'

describe('imageType', () => {
  test('returns a result with type named image', ({stubRegistry}) => {
    const result = imageType({}, stubRegistry)

    expect(result.type.name).toBe('image')
  })

  test('default config includes image, altText, and caption fields', ({stubRegistry}) => {
    const fields = getFields(imageType({}, stubRegistry))

    expect(fields).toHaveLength(3)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'altText', 'caption'])
  })

  test('altText: false excludes the altText field', ({stubRegistry}) => {
    const fields = getFields(imageType({altText: false}, stubRegistry))

    expect(fields).toHaveLength(2)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'caption'])
  })

  test('caption: false excludes the caption field', ({stubRegistry}) => {
    const fields = getFields(imageType({caption: false}, stubRegistry))

    expect(fields).toHaveLength(2)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'altText'])
  })

  test('both altText and caption disabled leaves only the image field', ({stubRegistry}) => {
    const fields = getFields(imageType({altText: false, caption: false}, stubRegistry))

    expect(fields).toHaveLength(1)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image'])
  })

  test('hotspot is enabled by default', ({stubRegistry}) => {
    const fields = getFields(imageType({}, stubRegistry))
    const imageField = getField(fields, 'image')

    expect(imageField).toHaveProperty('options.hotspot', true)
  })

  test('hotspot: false disables hotspot on the image field', ({stubRegistry}) => {
    const fields = getFields(imageType({hotspot: false}, stubRegistry))
    const imageField = getField(fields, 'image')

    expect(imageField).toHaveProperty('options.hotspot', false)
  })

  test('user-provided fields are appended', ({stubRegistry}) => {
    const result = imageType(
      {
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

describe('imageType map hooks', () => {
  test('map.fields can rename the caption field', ({stubRegistry}) => {
    const result = imageType(
      {
        map: {
          fields: (fields: FieldDefinition[] = []) =>
            fields.map((field) =>
              field.name === 'caption'
                ? {...field, name: 'description', title: 'Description'}
                : field,
            ),
        },
      },
      stubRegistry,
    )
    const fields = getFields(result)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'altText', 'description'])
    expect(getField(fields, 'image').type).toBe('image')
    expect(getField(fields, 'altText').type).toBe('string')
    expect(getField(fields, 'description').title).toBe('Description')
  })
})

describe('imageType preview.select', () => {
  test('selects altText as title by default', ({stubRegistry}) => {
    const typeDef = imageType({}, stubRegistry).type
    const select = typeDef && 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      title: 'altText',
      media: 'image',
    })
  })

  test('selects caption as title when altText is disabled', ({stubRegistry}) => {
    const typeDef = imageType({altText: false}, stubRegistry).type
    const select = typeDef && 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      title: 'caption',
      media: 'image',
    })
  })

  test('selects filename as title when altText and caption are disabled', ({stubRegistry}) => {
    const typeDef = imageType({altText: false, caption: false}, stubRegistry).type
    const select = typeDef && 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      title: 'image.asset.originalFilename',
      media: 'image',
    })
  })
})
