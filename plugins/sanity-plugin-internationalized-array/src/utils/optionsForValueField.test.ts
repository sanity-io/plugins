import {createSchema, defineField, defineType, isArraySchemaType, isObjectSchemaType} from 'sanity'
import {describe, expect, test} from 'vitest'

import arrayFactory from '../schema/array'
import objectFactory from '../schema/object'
import {optionsForValueField} from './optionsForValueField'

const ACCEPT = '.vtt,.srt,text/vtt,application/x-subrip'

describe('optionsForValueField', () => {
  test('copies underlying field options and drops plugin options', () => {
    expect(
      optionsForValueField(
        {
          accept: ACCEPT,
          collapsed: true,
          apiVersion: '2025-10-15',
          languages: [{id: 'en', title: 'English'}],
          select: {market: 'market'},
        },
        {accept: ''},
      ),
    ).toEqual({
      accept: ACCEPT,
      collapsed: true,
    })
  })

  test('field options override options configured on the value type', () => {
    expect(
      optionsForValueField({accept: ACCEPT}, {accept: 'image/*', storeOriginalFilename: false}),
    ).toEqual({
      accept: ACCEPT,
      storeOriginalFilename: false,
    })
  })

  test('returns the value field options when the array field has only plugin options', () => {
    const valueOptions = {accept: 'image/*'}
    expect(
      optionsForValueField(
        {apiVersion: '2025-10-15', languages: [], select: undefined},
        valueOptions,
      ),
    ).toBe(valueOptions)
  })

  test('returns undefined when neither side has options to apply', () => {
    expect(optionsForValueField(undefined, undefined)).toBeUndefined()
    expect(optionsForValueField(null, 'nope')).toBeUndefined()
  })
})

describe('compiled internationalizedArrayFile field', () => {
  const languages = [{id: 'en', title: 'English'}]
  const schema = createSchema({
    name: 'test',
    types: [
      arrayFactory({apiVersion: '2025-10-15', languages, type: 'file'}),
      objectFactory({type: 'file'}),
      defineType({
        name: 'video',
        type: 'document',
        fields: [
          defineField({
            name: 'subtitles',
            title: 'Subtitles/Captions',
            type: 'internationalizedArrayFile',
            options: {
              accept: ACCEPT,
              collapsed: true,
            },
          }),
        ],
      }),
    ],
  })

  const video = schema.get('video')
  if (!isObjectSchemaType(video)) {
    throw new Error('Expected video to compile as an object schema type')
  }
  const subtitles = video.fields.find((field) => field.name === 'subtitles')
  if (!subtitles || !isArraySchemaType(subtitles.type)) {
    throw new Error('Expected subtitles to compile as an array schema type')
  }
  const arrayType = subtitles.type
  const valueObject = arrayType.of.find(
    (member) => member.name === 'internationalizedArrayFileValue',
  )
  if (!isObjectSchemaType(valueObject)) {
    throw new Error('Expected an internationalizedArrayFileValue object')
  }
  const valueField = valueObject.fields.find((field) => field.name === 'value')
  if (!valueField) {
    throw new Error('Expected a value field')
  }

  test('keeps usage options on the array field', () => {
    expect(optionRecord(arrayType.options)).toMatchObject({
      accept: ACCEPT,
      collapsed: true,
    })
    // Setting field options replaces the array type's options object, so the
    // plugin's languages config stays on the parent type.
    expect(optionRecord(arrayType.options)).not.toHaveProperty('languages')
    expect(optionRecord(arrayType.type?.options)).toMatchObject({languages})
  })

  test('does not place those options on the shared file value field', () => {
    expect(optionRecord(valueField.type.options)).toMatchObject({accept: ''})
    expect(optionRecord(valueField.type.options)).not.toHaveProperty('collapsed')
  })

  test('merging array field options produces the file input options', () => {
    expect(optionsForValueField(arrayType.options, valueField.type.options)).toEqual({
      accept: ACCEPT,
      collapsed: true,
    })
  })
})

function optionRecord(options: unknown): Record<string, unknown> {
  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    throw new Error('Expected an options object')
  }
  const record: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(options)) {
    record[key] = value
  }
  return record
}
