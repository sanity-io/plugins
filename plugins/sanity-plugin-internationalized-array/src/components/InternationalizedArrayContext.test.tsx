import {act, cleanup, render, screen} from '@testing-library/react'
import {Suspense} from 'react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {clear} from '../cache'
import {CONFIG_DEFAULT} from '../constants'
import {ThemeWrapper} from '../test/component-helpers'
import {MOCK_LANGUAGES} from '../test/helpers'
import type {PluginConfig} from '../types'
import {
  InternationalizedArrayProvider,
  useInternationalizedArrayContext,
} from './InternationalizedArrayContext'

const mockClient = {fetch: vi.fn()}
const mockUseWorkspace = vi.fn(() => ({name: 'default'}))
const mockUseDocumentPane = vi.fn(() => ({formState: {value: {_type: 'i18nPost'}}}))
const mockLanguageFilter = vi.fn(() => ({
  selectedLanguageIds: ['en', 'es', 'fr', 'de'],
  options: {documentTypes: [] as string[], filterField: () => true},
}))

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    useClient: vi.fn(() => mockClient),
    useWorkspace: () => mockUseWorkspace(),
  }
})

vi.mock('sanity/structure', () => ({
  useDocumentPane: () => mockUseDocumentPane(),
}))

vi.mock('@sanity/language-filter', () => ({
  useLanguageFilterStudioContext: () => mockLanguageFilter(),
}))

function ContextReader() {
  const ctx = useInternationalizedArrayContext()
  return (
    <div>
      <span data-testid="lang-count">{ctx.languages.length}</span>
      <span data-testid="first-lang">{ctx.languages[0]?.id ?? 'none'}</span>
      <span data-testid="filtered-count">{ctx.filteredLanguages.length}</span>
      <span data-testid="filtered-ids">{ctx.filteredLanguages.map((l) => l.id).join(',')}</span>
    </div>
  )
}

function createConfig(overrides: Partial<Required<PluginConfig>> = {}): Required<PluginConfig> {
  return {
    ...CONFIG_DEFAULT,
    languages: MOCK_LANGUAGES,
    fieldTypes: ['string'],
    ...overrides,
  }
}

async function renderWithSuspense(config: Required<PluginConfig>, documentType = 'i18nPost') {
  await act(async () => {
    render(
      <Suspense fallback={<div data-testid="loading" />}>
        <InternationalizedArrayProvider internationalizedArray={config} documentType={documentType}>
          <ContextReader />
        </InternationalizedArrayProvider>
      </Suspense>,
      {wrapper: ThemeWrapper},
    )
  })
}

describe('InternationalizedArrayProvider', () => {
  beforeEach(() => {
    clear()
    mockUseWorkspace.mockReturnValue({name: 'default'})
    mockLanguageFilter.mockReturnValue({
      selectedLanguageIds: ['en', 'es', 'fr', 'de'],
      options: {documentTypes: [], filterField: () => true},
    })
  })

  afterEach(() => {
    cleanup()
    clear()
    vi.clearAllMocks()
  })

  test('provides sync languages to descendants', () => {
    render(
      <InternationalizedArrayProvider
        internationalizedArray={createConfig()}
        documentType="i18nPost"
      >
        <ContextReader />
      </InternationalizedArrayProvider>,
      {wrapper: ThemeWrapper},
    )

    expect(screen.getByTestId('lang-count')).toHaveTextContent(String(MOCK_LANGUAGES.length))
    expect(screen.getByTestId('first-lang')).toHaveTextContent('en')
    expect(screen.getByTestId('filtered-count')).toHaveTextContent(String(MOCK_LANGUAGES.length))
  })

  test('resolves async languages once and provides them', async () => {
    const asyncLanguages = vi.fn(async () => MOCK_LANGUAGES.slice(0, 2))
    mockUseWorkspace.mockReturnValue({name: 'workspace-async-i18n-array'})

    await renderWithSuspense(createConfig({languages: asyncLanguages}))

    expect(await screen.findByTestId('lang-count')).toHaveTextContent('2')
    expect(screen.getByTestId('first-lang')).toHaveTextContent('en')
    expect(asyncLanguages).toHaveBeenCalledTimes(1)
  })

  test('filters languages when language-filter is enabled for the document type', () => {
    mockLanguageFilter.mockReturnValue({
      selectedLanguageIds: ['en', 'fr'],
      options: {documentTypes: ['i18nPost'], filterField: () => true},
    })

    render(
      <InternationalizedArrayProvider
        internationalizedArray={createConfig()}
        documentType="i18nPost"
      >
        <ContextReader />
      </InternationalizedArrayProvider>,
      {wrapper: ThemeWrapper},
    )

    expect(screen.getByTestId('filtered-ids')).toHaveTextContent('en,fr')
    expect(screen.getByTestId('lang-count')).toHaveTextContent(String(MOCK_LANGUAGES.length))
  })

  test('does not filter languages when document type is not in languageFilter', () => {
    mockLanguageFilter.mockReturnValue({
      selectedLanguageIds: ['en'],
      options: {documentTypes: ['otherType'], filterField: () => true},
    })

    render(
      <InternationalizedArrayProvider
        internationalizedArray={createConfig()}
        documentType="i18nPost"
      >
        <ContextReader />
      </InternationalizedArrayProvider>,
      {wrapper: ThemeWrapper},
    )

    expect(screen.getByTestId('filtered-count')).toHaveTextContent(String(MOCK_LANGUAGES.length))
  })
})
