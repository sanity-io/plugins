import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import {type ObjectSchemaType} from 'sanity'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import type {Language, Metadata} from '../types'

import {useTranslationMetadata} from '../hooks/useLanguageMetadata'
import {ThemeWrapper} from '../test/component-helpers'
import {createMockDocument, MOCK_LANGUAGES, MOCK_PLUGIN_CONFIG, schema} from '../test/helpers'
import {useDocumentInternationalizationContext} from './DocumentInternationalizationContext'
import {DocumentInternationalizationMenu} from './DocumentInternationalizationMenu'

const mockUseEditState = vi.fn()

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    useEditState: (...args: unknown[]) => mockUseEditState(...args),
  }
})

vi.mock('../hooks/useLanguageMetadata', () => ({
  useTranslationMetadata: vi.fn(),
}))

vi.mock('./DocumentInternationalizationContext', () => ({
  useDocumentInternationalizationContext: vi.fn(),
}))

vi.mock('./LanguageManage', () => ({
  default: ({id}: {id?: string}) => <div data-testid="language-manage">{id ?? 'none'}</div>,
}))

vi.mock('./LanguageOption', () => ({
  default: ({
    language,
    current,
    disabled,
  }: {
    language: Language
    current: boolean
    disabled: boolean
  }) => (
    <div data-testid="language-option">
      {language.id}:{current ? 'current' : 'other'}:{disabled ? 'disabled' : 'enabled'}
    </div>
  ),
}))

vi.mock('./LanguagePatch', () => ({
  default: ({language, disabled}: {language: Language; disabled: boolean}) => (
    <div data-testid="language-patch">
      {language.id}:{disabled ? 'disabled' : 'enabled'}
    </div>
  ),
}))

describe('DocumentInternationalizationMenu', () => {
  const articleSchemaType = schema.get('article') as ObjectSchemaType

  beforeEach(() => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue(MOCK_PLUGIN_CONFIG)
    vi.mocked(useTranslationMetadata).mockReturnValue({
      data: [],
      loading: false,
      error: null,
    })
    mockUseEditState.mockReturnValue({
      draft: createMockDocument('drafts.doc-1', 'en'),
      published: null,
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('returns null when documentId is empty', () => {
    const {container} = render(
      <DocumentInternationalizationMenu documentId="" schemaType={articleSchemaType} />,
      {wrapper: ThemeWrapper},
    )

    expect(container.firstChild).toBeNull()
  })

  test('returns null when schemaType is not found', () => {
    const {container} = render(
      <DocumentInternationalizationMenu documentId="doc-1" schemaType={{} as ObjectSchemaType} />,
      {wrapper: ThemeWrapper},
    )

    expect(container.firstChild).toBeNull()
  })

  test('disables translations button when source document does not exist', () => {
    mockUseEditState.mockReturnValue({draft: null, published: null})

    render(<DocumentInternationalizationMenu documentId="doc-1" schemaType={articleSchemaType} />, {
      wrapper: ThemeWrapper,
    })

    expect(screen.getByRole('button', {name: 'Translations'})).toBeDisabled()
  })

  test('renders language options when source language is valid', async () => {
    vi.mocked(useTranslationMetadata).mockReturnValue({
      data: [{_id: 'meta-1', _createdAt: '2024-01-01', translations: []}],
      loading: false,
      error: null,
    })

    render(<DocumentInternationalizationMenu documentId="doc-1" schemaType={articleSchemaType} />, {
      wrapper: ThemeWrapper,
    })
    fireEvent.click(screen.getByRole('button', {name: 'Translations'}))

    await waitFor(() => {
      expect(screen.getAllByTestId('language-option')).toHaveLength(MOCK_LANGUAGES.length)
    })
    expect(screen.queryByTestId('language-patch')).not.toBeInTheDocument()
  })

  test('renders language patch options when source language is missing', async () => {
    mockUseEditState.mockReturnValue({
      draft: {_id: 'drafts.doc-1', _type: 'article'},
      published: null,
    })

    render(<DocumentInternationalizationMenu documentId="doc-1" schemaType={articleSchemaType} />, {
      wrapper: ThemeWrapper,
    })
    fireEvent.click(screen.getByRole('button', {name: 'Translations'}))

    await waitFor(() => {
      expect(screen.getAllByTestId('language-patch')).toHaveLength(MOCK_LANGUAGES.length)
    })
    expect(
      screen.getByText(/Choose a language to apply to/, {
        exact: false,
      }),
    ).toBeInTheDocument()
  })

  test('shows metadata request error state', async () => {
    vi.mocked(useTranslationMetadata).mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed'),
    })

    render(<DocumentInternationalizationMenu documentId="doc-1" schemaType={articleSchemaType} />, {
      wrapper: ThemeWrapper,
    })
    fireEvent.click(screen.getByRole('button', {name: 'Translations'}))

    expect(
      screen.getByText('There was an error returning translations metadata'),
    ).toBeInTheDocument()
  })

  test('shows warning when document appears in multiple metadata documents', async () => {
    const metadata: Metadata[] = [
      {_id: 'meta-1', _createdAt: '2024-01-01', translations: []},
      {_id: 'meta-2', _createdAt: '2024-01-02', translations: []},
    ]
    vi.mocked(useTranslationMetadata).mockReturnValue({
      data: metadata,
      loading: false,
      error: null,
    })

    render(<DocumentInternationalizationMenu documentId="doc-1" schemaType={articleSchemaType} />, {
      wrapper: ThemeWrapper,
    })
    fireEvent.click(screen.getByRole('button', {name: 'Translations'}))

    expect(
      screen.getByText(
        'This document has been found in more than one Translations Metadata document',
      ),
    ).toBeInTheDocument()
  })

  test('shows invalid source language warning when source language is unsupported', async () => {
    mockUseEditState.mockReturnValue({
      draft: createMockDocument('drafts.doc-1', 'it'),
      published: null,
    })

    render(<DocumentInternationalizationMenu documentId="doc-1" schemaType={articleSchemaType} />, {
      wrapper: ThemeWrapper,
    })
    fireEvent.click(screen.getByRole('button', {name: 'Translations'}))

    expect(
      screen.getByText('Select a supported language. Current language value:'),
    ).toBeInTheDocument()
    expect(screen.getByText('it')).toBeInTheDocument()
  })

  test('shows filter input for many languages and filters options by query', async () => {
    const manyLanguages: Language[] = [
      ...MOCK_LANGUAGES,
      {id: 'pt', title: 'Portuguese'},
      {id: 'it', title: 'Italian'},
    ]
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue({
      ...MOCK_PLUGIN_CONFIG,
      supportedLanguages: manyLanguages,
    })

    render(<DocumentInternationalizationMenu documentId="doc-1" schemaType={articleSchemaType} />, {
      wrapper: ThemeWrapper,
    })
    fireEvent.click(screen.getByRole('button', {name: 'Translations'}))

    expect(screen.getByPlaceholderText('Filter languages')).toBeInTheDocument()
    expect(screen.getAllByTestId('language-option')).toHaveLength(manyLanguages.length)

    fireEvent.change(screen.getByPlaceholderText('Filter languages'), {
      target: {value: 'port'},
    })

    await waitFor(() => {
      expect(screen.getAllByTestId('language-option')).toHaveLength(1)
    })
    expect(screen.getByText('pt:other:enabled')).toBeInTheDocument()
  })
})
