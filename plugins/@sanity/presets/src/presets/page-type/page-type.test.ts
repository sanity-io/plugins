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

  test('pageBuilderBlocks wraps inline array presets in an object so they can render', ({
    registry,
  }) => {
    const result = registry.definePage({
      name: 'landingPage',
      pageBuilderBlocks: [registry.defineRichText({name: 'inlineRichText', title: 'Inline rich'})],
    })
    const contentField = getField(getFields(result), 'content')

    assertArrayField(contentField)
    expect(contentField.of).toHaveLength(1)
    const wrapped = contentField.of[0]
    assertDefined(wrapped)
    expect(wrapped).toEqual(
      expect.objectContaining({name: 'inlineRichText', type: 'object', title: 'Inline rich'}),
    )
    expect(wrapped).toHaveProperty('fields')
    expect(wrapped.fields).toEqual([expect.objectContaining({name: 'content', type: 'array'})])
  })

  test('pageBuilderBlocks wraps a by-name string reference to an array preset registered before the page', ({
    registry,
  }) => {
    registry.defineRichText({name: 'richText', title: 'Rich text'})
    const result = registry.definePage({
      name: 'landingPage',
      pageBuilderBlocks: ['richText'],
    })
    const contentField = getField(getFields(result), 'content')

    assertArrayField(contentField)
    const wrapped = contentField.of[0]
    assertDefined(wrapped)
    expect(wrapped).toEqual(
      expect.objectContaining({name: 'richText', type: 'object', title: 'Rich text'}),
    )
    expect(wrapped).toHaveProperty('fields')
    expect(wrapped.fields).toEqual([expect.objectContaining({name: 'content', type: 'array'})])
  })

  test('pageBuilderBlocks wraps a by-name string reference even when the array preset is registered AFTER the page', ({
    registry,
  }) => {
    const page = registry.definePage({
      name: 'landingPage',
      pageBuilderBlocks: ['richText'],
    })
    registry.defineRichText({name: 'richText', title: 'Rich text'})

    const contentField = getField(getFields(page), 'content')
    assertArrayField(contentField)
    const wrapped = contentField.of[0]
    assertDefined(wrapped)
    expect(wrapped).toEqual(
      expect.objectContaining({name: 'richText', type: 'object', title: 'Rich text'}),
    )
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
        type: 'image',
      }),
    )
    expect(inlineMember).toHaveProperty('options.hotspot', true)
    expect(inlineMember).toHaveProperty('fields')
    expect(inlineMember.fields).toHaveLength(0)
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
