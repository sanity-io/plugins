import type {ObjectSchemaType} from 'sanity'

import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import type {Language, Metadata} from '../types'

import {createMockSanityClient, ThemeWrapper} from '../test/component-helpers'
import {
  createMockDocument,
  createMockMetadata,
  createMockTranslation,
  MOCK_PLUGIN_CONFIG,
} from '../test/helpers'
import {useDocumentInternationalizationContext} from './DocumentInternationalizationContext'
import LanguageOption from './LanguageOption'

// Mock the context
vi.mock('./DocumentInternationalizationContext', () => ({
  useDocumentInternationalizationContext: vi.fn(),
}))

// Mock useOpenInNewPane hook
const mockOpenInNewPane = vi.fn()
vi.mock('../hooks/useOpenInNewPane', () => ({
  useOpenInNewPane: vi.fn(() => mockOpenInNewPane),
}))

// Mock sanity's useClient
const mockToastPush = vi.fn()
let mockClient: ReturnType<typeof createMockSanityClient>

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    useClient: vi.fn(() => mockClient),
  }
})

vi.mock('@sanity/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sanity/ui')>()
  return {
    ...actual,
    useToast: () => ({push: mockToastPush}),
  }
})

// Mock @sanity/uuid
vi.mock('@sanity/uuid', () => ({
  uuid: () => 'mock-uuid-123',
}))

const mockSchemaType: ObjectSchemaType = {
  name: 'article',
  type: 'document',
  jsonType: 'object',
  fields: [],
} as unknown as ObjectSchemaType

describe('LanguageOption', () => {
  const mockLanguage: Language = {id: 'fr', title: 'French'}

  beforeEach(() => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue(MOCK_PLUGIN_CONFIG)
    mockClient = createMockSanityClient()
    mockToastPush.mockClear()
    mockOpenInNewPane.mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('renders language title', () => {
    const source = createMockDocument('doc-1', 'en')
    render(
      <LanguageOption
        language={mockLanguage}
        schemaType={mockSchemaType}
        documentId="doc-1"
        disabled={false}
        current={false}
        source={source}
        metadataId="meta-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    expect(screen.getByText('French')).toBeInTheDocument()
  })

  test('renders language id in badge', () => {
    const source = createMockDocument('doc-1', 'en')
    render(
      <LanguageOption
        language={mockLanguage}
        schemaType={mockSchemaType}
        documentId="doc-1"
        disabled={false}
        current={false}
        source={source}
        metadataId="meta-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    expect(screen.getByText('fr')).toBeInTheDocument()
  })

  test('renders with checkmark icon for current language', () => {
    const source = createMockDocument('doc-1', 'fr')
    const {container} = render(
      <LanguageOption
        language={mockLanguage}
        schemaType={mockSchemaType}
        documentId="doc-1"
        disabled={false}
        current={true}
        source={source}
        metadataId="meta-1"
        sourceLanguageId="fr"
      />,
      {wrapper: ThemeWrapper},
    )

    expect(container.querySelector('[data-sanity-icon="checkmark"]')).toBeInTheDocument()
  })

  test('renders with split icon for existing translation', () => {
    const source = createMockDocument('doc-1', 'en')
    const translations = [createMockTranslation('fr', 'existing-fr-doc')]
    const metadata = createMockMetadata('meta-1', translations)

    const {container} = render(
      <LanguageOption
        language={mockLanguage}
        schemaType={mockSchemaType}
        documentId="doc-1"
        disabled={false}
        current={false}
        source={source}
        metadataId="meta-1"
        metadata={metadata}
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    expect(container.querySelector('[data-sanity-icon="split-vertical"]')).toBeInTheDocument()
  })

  test('renders with add icon for new translation option', () => {
    const source = createMockDocument('doc-1', 'en')
    const {container} = render(
      <LanguageOption
        language={mockLanguage}
        schemaType={mockSchemaType}
        documentId="doc-1"
        disabled={false}
        current={false}
        source={source}
        metadataId="meta-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    expect(container.querySelector('[data-sanity-icon="add"]')).toBeInTheDocument()
  })

  test('disables button when source is null', () => {
    render(
      <LanguageOption
        language={mockLanguage}
        schemaType={mockSchemaType}
        documentId="doc-1"
        disabled={false}
        current={false}
        source={null}
        metadataId="meta-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-disabled', 'true')
  })

  test('disables button when metadataId is null', () => {
    const source = createMockDocument('doc-1', 'en')
    render(
      <LanguageOption
        language={mockLanguage}
        schemaType={mockSchemaType}
        documentId="doc-1"
        disabled={false}
        current={false}
        source={source}
        metadataId={null}
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-disabled', 'true')
  })

  test('disables button when sourceLanguageId is undefined', () => {
    const source = createMockDocument('doc-1', 'en')
    render(
      <LanguageOption
        language={mockLanguage}
        schemaType={mockSchemaType}
        documentId="doc-1"
        disabled={false}
        current={false}
        source={source}
        metadataId="meta-1"
        sourceLanguageId={undefined}
      />,
      {wrapper: ThemeWrapper},
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-disabled', 'true')
  })

  test('disables button when disabled prop is true', () => {
    const source = createMockDocument('doc-1', 'en')
    render(
      <LanguageOption
        language={mockLanguage}
        schemaType={mockSchemaType}
        documentId="doc-1"
        disabled={true}
        current={false}
        source={source}
        metadataId="meta-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-disabled', 'true')
  })

  test('disables button when current is true', () => {
    const source = createMockDocument('doc-1', 'fr')
    render(
      <LanguageOption
        language={mockLanguage}
        schemaType={mockSchemaType}
        documentId="doc-1"
        disabled={false}
        current={true}
        source={source}
        metadataId="meta-1"
        sourceLanguageId="fr"
      />,
      {wrapper: ThemeWrapper},
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-disabled', 'true')
  })

  test('opens existing translation in new pane on click', async () => {
    const source = createMockDocument('doc-1', 'en')
    const translations = [createMockTranslation('fr', 'existing-fr-doc')]
    const metadata = createMockMetadata('meta-1', translations)

    render(
      <LanguageOption
        language={mockLanguage}
        schemaType={mockSchemaType}
        documentId="doc-1"
        disabled={false}
        current={false}
        source={source}
        metadataId="meta-1"
        metadata={metadata}
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    fireEvent.click(screen.getByRole('button'))

    expect(mockOpenInNewPane).toHaveBeenCalled()
  })

  test('creates new translation via transaction on click', async () => {
    const source = createMockDocument('doc-1', 'en')
    render(
      <LanguageOption
        language={mockLanguage}
        schemaType={mockSchemaType}
        documentId="doc-1"
        disabled={false}
        current={false}
        source={source}
        metadataId="meta-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockClient.transaction).toHaveBeenCalled()
    })
  })

  test('shows success toast after creating translation', async () => {
    const source = createMockDocument('doc-1', 'en')
    render(
      <LanguageOption
        language={mockLanguage}
        schemaType={mockSchemaType}
        documentId="doc-1"
        disabled={false}
        current={false}
        source={source}
        metadataId="meta-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockToastPush).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          title: 'Created "French" translation',
        }),
      )
    })
  })

  test('shows error toast on transaction failure', async () => {
    mockClient = createMockSanityClient()
    const transactionMock = mockClient.transaction()
    transactionMock.commit.mockRejectedValueOnce(new Error('Transaction failed'))

    const {useClient} = await import('sanity')
    vi.mocked(useClient).mockReturnValue(mockClient as unknown as ReturnType<typeof useClient>)

    const source = createMockDocument('doc-1', 'en')
    render(
      <LanguageOption
        language={mockLanguage}
        schemaType={mockSchemaType}
        documentId="doc-1"
        disabled={false}
        current={false}
        source={source}
        metadataId="meta-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockToastPush).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          title: 'Error creating translation',
        }),
      )
    })
  })
})
