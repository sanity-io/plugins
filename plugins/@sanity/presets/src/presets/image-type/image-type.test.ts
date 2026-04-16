import type {FieldDefinition} from 'sanity'
import {describe, expect, test} from 'vitest'

import {imageType} from './index'

const getPreset = (): Record<string, unknown> => ({})

function getFields(result: ReturnType<typeof imageType>): FieldDefinition[] {
  const typeDef = result.type
  if (!typeDef || !('fields' in typeDef) || !typeDef.fields) {
    throw new Error('Expected an object type definition with fields')
  }
  return typeDef.fields
}

function getField(fields: FieldDefinition[], name: string): FieldDefinition {
  const field = fields.find((entry) => entry.name === name)
  if (!field) {
    throw new Error(`Field "${name}" not found`)
  }
  return field
}

describe('imageType', () => {
  test('returns a result with type named image', () => {
    const result = imageType({getPreset})

    expect(result.type.name).toBe('image')
  })

  test('default config includes image, altText, and caption fields', () => {
    const fields = getFields(imageType({getPreset}))

    expect(fields).toHaveLength(3)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'altText', 'caption'])
  })

  test('altText: false excludes the altText field', () => {
    const fields = getFields(imageType({getPreset, altText: false}))

    expect(fields).toHaveLength(2)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'caption'])
  })

  test('caption: false excludes the caption field', () => {
    const fields = getFields(imageType({getPreset, caption: false}))

    expect(fields).toHaveLength(2)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'altText'])
  })

  test('both altText and caption disabled leaves only the image field', () => {
    const fields = getFields(imageType({getPreset, altText: false, caption: false}))

    expect(fields).toHaveLength(1)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image'])
  })

  test('hotspot is enabled by default', () => {
    const fields = getFields(imageType({getPreset}))
    const imageField = getField(fields, 'image')

    expect(imageField).toHaveProperty('options.hotspot', true)
  })

  test('hotspot: false disables hotspot on the image field', () => {
    const fields = getFields(imageType({getPreset, hotspot: false}))
    const imageField = getField(fields, 'image')

    expect(imageField).toHaveProperty('options.hotspot', false)
  })

  test('user-provided fields are appended', () => {
    const result = imageType({
      getPreset,
      fields: [{name: 'credit', type: 'string', title: 'Credit'}],
    })
    const fields = getFields(result)

    expect(fields).toHaveLength(4)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'altText', 'caption', 'credit'])
  })
})

describe('imageType map hooks', () => {
  test('map.fields can rename the caption field', () => {
    const result = imageType({
      getPreset,
      map: {
        fields: (fields = []) =>
          fields.map((field) =>
            field.name === 'caption'
              ? {...field, name: 'description', title: 'Description'}
              : field,
          ),
      },
    })
    const fields = getFields(result)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'altText', 'description'])
    expect(getField(fields, 'image').type).toBe('image')
    expect(getField(fields, 'altText').type).toBe('string')
    expect(getField(fields, 'description').title).toBe('Description')
  })
})

describe('imageType preview.select', () => {
  test('selects altText as title by default', () => {
    const typeDef = imageType({getPreset}).type
    const select = typeDef && 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      title: 'altText',
      media: 'image',
    })
  })

  test('selects caption as title when altText is disabled', () => {
    const typeDef = imageType({getPreset, altText: false}).type
    const select = typeDef && 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      title: 'caption',
      media: 'image',
    })
  })

  test('selects filename as title when altText and caption are disabled', () => {
    const typeDef = imageType({getPreset, altText: false, caption: false}).type
    const select = typeDef && 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      title: 'image.asset.originalFilename',
      media: 'image',
    })
  })
})
