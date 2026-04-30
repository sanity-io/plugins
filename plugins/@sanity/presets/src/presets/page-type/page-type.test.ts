import {describe, expect} from 'vitest'

import {getField, getFields, test} from '../../test/fixtures'
import {pageType} from './index'

describe('pageType', () => {
  test('has the expected name and identifier', () => {
    expect(pageType.name).toBe('page')
    expect(pageType.identifier).toBe('core.page')
  })

  test('returns a document type with the configured name', ({stubRegistry}) => {
    const result = pageType.schemaType({name: 'landingPage'}, stubRegistry)

    expect(result.name).toBe('landingPage')
    expect(result).toHaveProperty('type', 'document')
  })

  test('pageBuilderBlocks accepts string references and produces array members for each', ({
    stubRegistry,
  }) => {
    const fields = getFields(
      pageType.schemaType(
        {name: 'landingPage', pageBuilderBlocks: ['hero', 'callout']},
        stubRegistry,
      ),
    )
    const contentField = getField(fields, 'content')

    assertArrayField(contentField)
    expect(contentField.of).toEqual([{type: 'hero'}, {type: 'callout'}])
  })

  test('pageBuilderBlocks accepts inline preset instances alongside string references', ({
    registry,
  }) => {
    const inlineHero = registry.defineImage({name: 'heroImage', altText: false, caption: false})
    const result = registry.definePage({
      name: 'landingPage',
      pageBuilderBlocks: ['callout', inlineHero],
    })
    const fields = getFields(result)
    const contentField = getField(fields, 'content')

    assertArrayField(contentField)
    expect(contentField.of).toHaveLength(2)
    expect(contentField.of[0]).toEqual({type: 'callout'})

    const inlineMember = contentField.of[1]
    assertDefined(inlineMember)
    expect(inlineMember).toEqual(
      expect.objectContaining({
        name: 'heroImage',
        type: 'object',
      }),
    )
    expect(inlineMember).toHaveProperty('fields')
    expect(inlineMember.fields).toEqual(
      expect.arrayContaining([expect.objectContaining({name: 'image', type: 'image'})]),
    )
    expect(inlineMember.fields).toHaveLength(1)
  })
})

function assertArrayField(
  field: ReturnType<typeof getField>,
): asserts field is ReturnType<typeof getField> & {of: Array<Record<string, unknown>>} {
  if (!('of' in field) || !Array.isArray(field.of)) {
    throw new Error(`Expected field "${field.name}" to be an array field`)
  }
}

function assertDefined<Value>(value: Value | undefined): asserts value is Value {
  if (value === undefined) {
    throw new Error('Expected value to be defined')
  }
}
