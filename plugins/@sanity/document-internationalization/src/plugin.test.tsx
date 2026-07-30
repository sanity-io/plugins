/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import {cleanup, render, screen} from '@testing-library/react'
import type {DocumentLanguageFilterContext, ObjectSchemaType, SchemaTypeDefinition} from 'sanity'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {METADATA_SCHEMA_NAME} from './constants'
import {documentInternationalization} from './plugin'
import {ThemeWrapper} from './test/component-helpers'
import {createMockMetadata, createMockTranslation, MOCK_LANGUAGES} from './test/helpers'
import type {TranslationReference} from './types'

vi.mock('./components/BulkPublish', () => ({
  default: ({translations}: {translations: TranslationReference[]}) => (
    <div data-testid="bulk-publish">bulk:{translations.length}</div>
  ),
}))

vi.mock('./components/OptimisticallyStrengthen', () => ({
  default: ({translations}: {translations: TranslationReference[]}) => (
    <div data-testid="optimistically-strengthen">strengthen:{translations.length}</div>
  ),
}))

vi.mock('sanity-plugin-internationalized-array', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity-plugin-internationalized-array')>()
  return {
    ...actual,
    internationalizedArray: vi.fn(() => ({name: 'mock-internationalized-array'})),
  }
})

type PluginInstance = ReturnType<typeof documentInternationalization>

type LanguageFilterFn = (
  prev: Array<() => null>,
  context: DocumentLanguageFilterContext,
) => Array<() => null>

type BadgesFn = (
  prev: Array<() => {label: string}>,
  context: {schemaType: string},
) => Array<() => {label: string}>

type ActionsFn = (
  prev: Array<() => {label: string}>,
  context: {schemaType: string},
) => Array<() => {label: string}>

type TemplateItem = {
  id: string
  title?: string
  schemaType?: string
  value?: ((params: {languageId: string}) => Record<string, string>) | Record<string, string>
}

type TemplatesFn = (
  prev: TemplateItem[],
  context: {schema: {get: (name: string) => {title: string}}},
) => TemplateItem[]

type InputComponent = (props: Record<string, unknown>) => React.JSX.Element

function createPlugin(
  overrides: Partial<Parameters<typeof documentInternationalization>[0]> = {},
): PluginInstance {
  return documentInternationalization({
    supportedLanguages: MOCK_LANGUAGES,
    schemaTypes: ['article', 'page'],
    ...overrides,
  })
}

function getLanguageFilter(plugin: PluginInstance): LanguageFilterFn {
  return plugin.document!.unstable_languageFilter as unknown as LanguageFilterFn
}

function getBadges(plugin: PluginInstance): BadgesFn {
  return plugin.document!.badges as unknown as BadgesFn
}

function getActions(plugin: PluginInstance): ActionsFn {
  return plugin.document!.actions as unknown as ActionsFn
}

function getTemplates(plugin: PluginInstance): TemplatesFn {
  return plugin.schema!.templates as unknown as TemplatesFn
}

function getInputComponent(plugin: PluginInstance): InputComponent {
  return plugin.form!.components!.input as unknown as InputComponent
}

function getSchemaTypes(plugin: PluginInstance): SchemaTypeDefinition[] {
  return plugin.schema!.types as unknown as SchemaTypeDefinition[]
}

function createLanguageFilterContext(
  overrides: Partial<DocumentLanguageFilterContext> = {},
): DocumentLanguageFilterContext {
  return {
    schemaType: 'article',
    documentId: 'doc-1',
    ...overrides,
  } as DocumentLanguageFilterContext
}

describe('documentInternationalization plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  test('throws when schemaTypes is empty', () => {
    expect(() =>
      documentInternationalization({
        supportedLanguages: MOCK_LANGUAGES,
        schemaTypes: [],
      }),
    ).toThrow(/must specify at least one schema type/i)
  })

  test('registers plugin name and metadata schema type', () => {
    const plugin = createPlugin()
    const types = getSchemaTypes(plugin)

    expect(plugin.name).toBe('@sanity/document-internationalization')
    expect(types).toHaveLength(1)
    expect(types[0]).toMatchObject({name: METADATA_SCHEMA_NAME})
  })

  describe('unstable_languageFilter', () => {
    test('appends Translations menu for configured schema types with documentId', () => {
      const languageFilter = getLanguageFilter(createPlugin())
      const prev = [() => null]
      const result = languageFilter(
        prev,
        createLanguageFilterContext({schemaType: 'article', documentId: 'doc-1'}),
      )

      expect(result).toHaveLength(2)
      expect(result[1]).toBeTypeOf('function')
    })

    test('does not append menu for unconfigured schema types', () => {
      const languageFilter = getLanguageFilter(createPlugin())
      const prev = [() => null]
      const result = languageFilter(
        prev,
        createLanguageFilterContext({schemaType: 'author', documentId: 'doc-1'}),
      )

      expect(result).toBe(prev)
    })

    test('does not append menu when documentId is missing', () => {
      const languageFilter = getLanguageFilter(createPlugin())
      const prev = [() => null]
      const result = languageFilter(prev, createLanguageFilterContext({documentId: undefined}))

      expect(result).toBe(prev)
    })

    test('hides language filter when hideLanguageFilter is true', () => {
      const languageFilter = getLanguageFilter(createPlugin({hideLanguageFilter: true}))
      const prev = [() => null]
      const result = languageFilter(prev, createLanguageFilterContext())

      expect(result).toBe(prev)
    })

    test('hides language filter when schema type is in hideLanguageFilter array', () => {
      const languageFilter = getLanguageFilter(createPlugin({hideLanguageFilter: ['article']}))
      const prev = [() => null]
      const result = languageFilter(prev, createLanguageFilterContext({schemaType: 'article'}))

      expect(result).toBe(prev)
    })

    test('keeps language filter when schema type is not in hideLanguageFilter array', () => {
      const languageFilter = getLanguageFilter(createPlugin({hideLanguageFilter: ['page']}))
      const prev = [() => null]
      const result = languageFilter(prev, createLanguageFilterContext({schemaType: 'article'}))

      expect(result).toHaveLength(2)
    })

    test('hides language filter when hideLanguageFilter function returns true', () => {
      const languageFilter = getLanguageFilter(
        createPlugin({
          hideLanguageFilter: (ctx) => ctx.schemaType === 'article',
        }),
      )
      const prev = [() => null]
      const result = languageFilter(prev, createLanguageFilterContext({schemaType: 'article'}))

      expect(result).toBe(prev)
    })
  })

  describe('badges', () => {
    test('prepends LanguageBadge for configured schema types', () => {
      const badges = getBadges(createPlugin())
      const prev = [() => ({label: 'existing'})]
      const result = badges(prev, {schemaType: 'article'})

      expect(result).toHaveLength(2)
      expect(result[0]).toBeTypeOf('function')
      expect(result[1]).toBe(prev[0])
    })

    test('leaves badges unchanged for unconfigured schema types', () => {
      const badges = getBadges(createPlugin())
      const prev = [() => ({label: 'existing'})]
      const result = badges(prev, {schemaType: 'author'})

      expect(result).toBe(prev)
    })
  })

  describe('actions', () => {
    test('adds DeleteMetadataAction for translation.metadata', () => {
      const actions = getActions(createPlugin())
      const prev = [() => ({label: 'existing'})]
      const result = actions(prev, {schemaType: METADATA_SCHEMA_NAME})

      expect(result).toHaveLength(2)
      expect(result[1]).toBeTypeOf('function')
    })

    test('leaves actions unchanged for other schema types', () => {
      const actions = getActions(createPlugin())
      const prev = [() => ({label: 'existing'})]
      const result = actions(prev, {schemaType: 'article'})

      expect(result).toBe(prev)
    })
  })

  describe('schema.templates', () => {
    const mockSchema = {
      get: (name: string) => ({title: name === 'article' ? 'Article' : name}),
    }

    test('adds parameterized and static language templates by default', () => {
      const templates = getTemplates(
        createPlugin({
          supportedLanguages: [
            {id: 'en', title: 'English'},
            {id: 'fr', title: 'French'},
          ],
          schemaTypes: ['article'],
        }),
      )([], {schema: mockSchema})

      expect(templates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'article-parameterized',
            schemaType: 'article',
          }),
          expect.objectContaining({
            id: 'article-en',
            title: 'English Article',
            value: {language: 'en'},
          }),
          expect.objectContaining({
            id: 'article-fr',
            title: 'French Article',
            value: {language: 'fr'},
          }),
        ]),
      )
    })

    test('parameterized template value sets the configured languageField', () => {
      const templates = getTemplates(
        createPlugin({
          languageField: 'locale',
          supportedLanguages: [{id: 'en', title: 'English'}],
          schemaTypes: ['article'],
        }),
      )([], {schema: mockSchema})
      const parameterized = templates.find((t: TemplateItem) => t.id === 'article-parameterized')
      const valueFn = parameterized?.value as (params: {
        languageId: string
      }) => Record<string, string>

      expect(valueFn({languageId: 'en'})).toEqual({locale: 'en'})
    })

    test('skips templates when addTemplates is false', () => {
      const prev = [{id: 'existing'}]
      const templates = getTemplates(createPlugin({addTemplates: false}))(prev, {
        schema: mockSchema,
      })

      expect(templates).toBe(prev)
    })

    test('skips templates when supportedLanguages is async', () => {
      const prev = [{id: 'existing'}]
      const templates = getTemplates(
        createPlugin({
          supportedLanguages: async () => MOCK_LANGUAGES,
        }),
      )(prev, {schema: mockSchema})

      expect(templates).toBe(prev)
    })
  })

  describe('form.components.input', () => {
    const renderDefault = vi.fn(() => <div data-testid="default-input">default</div>)

    function createInputProps(overrides: Record<string, unknown> = {}) {
      return {
        id: 'root',
        schemaType: {name: METADATA_SCHEMA_NAME} as ObjectSchemaType,
        value: createMockMetadata('meta-1', [
          createMockTranslation('en', 'doc-1', {weak: true, strengthenOnPublish: true}),
        ]),
        renderDefault,
        ...overrides,
      }
    }

    test('renders default input for non-metadata documents', () => {
      const Input = getInputComponent(createPlugin({bulkPublish: true}))

      render(
        Input({
          ...createInputProps({
            schemaType: {name: 'article'},
          }),
        }),
        {wrapper: ThemeWrapper},
      )

      expect(screen.getByTestId('default-input')).toBeInTheDocument()
      expect(screen.queryByTestId('bulk-publish')).not.toBeInTheDocument()
    })

    test('renders BulkPublish when bulkPublish is enabled on metadata root', () => {
      const Input = getInputComponent(createPlugin({bulkPublish: true}))

      render(Input(createInputProps()), {wrapper: ThemeWrapper})

      expect(screen.getByTestId('bulk-publish')).toHaveTextContent('bulk:1')
      expect(screen.getByTestId('default-input')).toBeInTheDocument()
    })

    test('does not render BulkPublish when bulkPublish is disabled', () => {
      const Input = getInputComponent(createPlugin({bulkPublish: false}))

      render(Input(createInputProps()), {wrapper: ThemeWrapper})

      expect(screen.queryByTestId('bulk-publish')).not.toBeInTheDocument()
    })

    test('renders OptimisticallyStrengthen for weak refs with _strengthenOnPublish', () => {
      const Input = getInputComponent(createPlugin({bulkPublish: false}))

      render(Input(createInputProps()), {wrapper: ThemeWrapper})

      expect(screen.getByTestId('optimistically-strengthen')).toHaveTextContent('strengthen:1')
    })

    test('does not render OptimisticallyStrengthen when no weak strengthen refs', () => {
      const Input = getInputComponent(createPlugin())
      const strongTranslation = createMockTranslation('en', 'doc-1', {
        weak: false,
        strengthenOnPublish: false,
      })

      render(
        Input(
          createInputProps({
            value: createMockMetadata('meta-1', [strongTranslation]),
          }),
        ),
        {wrapper: ThemeWrapper},
      )

      expect(screen.queryByTestId('optimistically-strengthen')).not.toBeInTheDocument()
    })
  })
})
