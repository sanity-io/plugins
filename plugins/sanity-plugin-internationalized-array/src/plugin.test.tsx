/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import {languageFilter} from '@sanity/language-filter'
import type {ObjectInputProps, ObjectSchemaType, SchemaTypeDefinition} from 'sanity'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {internationalizedArray} from './plugin'
import {MOCK_LANGUAGES} from './test/helpers'

vi.mock('@sanity/language-filter', () => ({
  languageFilter: vi.fn((config: unknown) => ({
    name: 'mock-language-filter',
    config,
  })),
}))

vi.mock('./components/InternationalizedArrayLayout', () => ({
  InternationalizedArrayLayout: (props: {renderDefault: (p: unknown) => unknown}) =>
    props.renderDefault(props),
}))

vi.mock('./components/InternationalizedArrayFormInput', () => ({
  InternationalizedArrayFormInput: () => <div data-testid="i18n-form-input" />,
}))

vi.mock('./components/Preload', () => ({
  default: () => null,
}))

type PluginInstance = ReturnType<typeof internationalizedArray>
type InputComponent = (props: Record<string, unknown>) => unknown

function createPlugin(
  overrides: Partial<Parameters<typeof internationalizedArray>[0]> = {},
): PluginInstance {
  return internationalizedArray({
    languages: MOCK_LANGUAGES,
    fieldTypes: ['string', 'text'],
    ...overrides,
  })
}

function getSchemaTypes(plugin: PluginInstance): SchemaTypeDefinition[] {
  return plugin.schema!.types as unknown as SchemaTypeDefinition[]
}

describe('internationalizedArray plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('registers array and value object schema types for each fieldType', () => {
    const types = getSchemaTypes(createPlugin())
    const names = types.map((t) => t.name)

    expect(names).toContain('internationalizedArrayString')
    expect(names).toContain('internationalizedArrayStringValue')
    expect(names).toContain('internationalizedArrayText')
    expect(names).toContain('internationalizedArrayTextValue')
  })

  test('registers document layout wrapper', () => {
    const plugin = createPlugin()
    expect(plugin.document?.components?.unstable_layout).toBeTypeOf('function')
  })

  test('registers form input wrapper for root object inputs', () => {
    const plugin = createPlugin()
    expect(plugin.form?.components?.input).toBeTypeOf('function')
  })

  test('form input renders default when not root', () => {
    const plugin = createPlugin()
    const input = plugin.form!.components!.input as unknown as InputComponent
    const renderDefault = vi.fn(() => <div data-testid="default" />)

    input({
      id: 'title',
      renderDefault,
      schemaType: {name: 'string', jsonType: 'string'},
    })

    expect(renderDefault).toHaveBeenCalled()
  })

  test('form input uses InternationalizedArrayFormInput for root docs with i18n arrays', () => {
    const plugin = createPlugin()
    const input = plugin.form!.components!.input as unknown as (props: ObjectInputProps) => unknown

    const schemaType = {
      name: 'i18nPost',
      jsonType: 'object',
      fields: [
        {
          name: 'title',
          type: {
            name: 'internationalizedArrayString',
            jsonType: 'array',
            type: {name: 'array', jsonType: 'array'},
          },
        },
      ],
    } as unknown as ObjectSchemaType

    const result = input({
      id: 'root',
      schemaType,
      renderDefault: () => <div />,
    } as unknown as ObjectInputProps)

    expect(result).toBeTruthy()
  })

  test('adds field actions when buttonLocations includes unstable__fieldAction', () => {
    const plugin = createPlugin({buttonLocations: ['field', 'unstable__fieldAction']})
    const fieldActions = plugin.document!.unstable_fieldActions
    expect(fieldActions).toBeTypeOf('function')

    const next = (fieldActions as unknown as (prev: unknown[]) => unknown[])([])
    expect(next).toHaveLength(1)
  })

  test('omits field actions when unstable__fieldAction is not configured', () => {
    const plugin = createPlugin({buttonLocations: ['field']})
    expect(plugin.document!.unstable_fieldActions).toBeUndefined()
  })

  test('nests languageFilter plugin when languageFilter.documentTypes is set', () => {
    createPlugin({
      languageFilter: {
        documentTypes: ['i18nPost'],
        defaultLanguages: ['en'],
      },
    })

    expect(languageFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        documentTypes: ['i18nPost'],
        supportedLanguages: MOCK_LANGUAGES,
        defaultLanguages: ['en'],
      }),
    )
  })

  test('does not nest languageFilter when documentTypes is empty', () => {
    const plugin = createPlugin({
      languageFilter: {documentTypes: []},
    })
    expect(plugin.plugins).toBeUndefined()
    expect(languageFilter).not.toHaveBeenCalled()
  })

  test('adds studio layout Preload when languages is a callback', () => {
    const plugin = createPlugin({
      languages: async () => MOCK_LANGUAGES,
    })
    expect(plugin.studio?.components?.layout).toBeTypeOf('function')
  })

  test('omits studio layout Preload when languages is a static array', () => {
    const plugin = createPlugin({languages: MOCK_LANGUAGES})
    expect(plugin.studio).toBeUndefined()
  })
})
