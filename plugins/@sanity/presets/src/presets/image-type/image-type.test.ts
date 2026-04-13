import type {FieldDefinition} from 'sanity'
import {describe, expect, test} from 'vitest'

import {IMAGE_TYPE_NAME} from './constants'
import {imageType} from './index'

function getFields(result: ReturnType<typeof imageType>): FieldDefinition[] {
  const typeDef = result[0]?.type
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
  test('returns one type named core.presets.image', () => {
    const result = imageType()

    expect(result).toHaveLength(1)
    expect(result[0]?.type?.name).toBe(IMAGE_TYPE_NAME)
  })

  test('default config includes image, altText, and caption fields', () => {
    const fields = getFields(imageType())

    expect(fields).toHaveLength(3)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'altText', 'caption'])
  })

  test('altText: false excludes the altText field', () => {
    const fields = getFields(imageType({altText: false}))

    expect(fields).toHaveLength(2)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'caption'])
  })

  test('caption: false excludes the caption field', () => {
    const fields = getFields(imageType({caption: false}))

    expect(fields).toHaveLength(2)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image', 'altText'])
  })

  test('both altText and caption disabled leaves only the image field', () => {
    const fields = getFields(imageType({altText: false, caption: false}))

    expect(fields).toHaveLength(1)

    const fieldNames = fields.map((field) => field.name)
    expect(fieldNames).toEqual(['image'])
  })

  test('hotspot is enabled by default', () => {
    const fields = getFields(imageType())
    const imageField = getField(fields, 'image')

    expect(imageField).toHaveProperty('options.hotspot', true)
  })

  test('hotspot: false disables hotspot on the image field', () => {
    const fields = getFields(imageType({hotspot: false}))
    const imageField = getField(fields, 'image')

    expect(imageField).toHaveProperty('options.hotspot', false)
  })

  test('user-provided fields are appended', () => {
    const result = imageType({
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
    expect(getField(fields, 'description').title).toBe('Description')
  })
})

describe('imageType preview.select', () => {
  test('selects altText as title and image as media', () => {
    const typeDef = imageType()[0]?.type
    const select = typeDef && 'preview' in typeDef ? typeDef.preview?.select : undefined

    expect(select).toEqual({
      title: 'altText',
      media: 'image',
    })
  })
})
