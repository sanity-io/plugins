/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import type {ObjectSchemaType} from 'sanity'

import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {LANGUAGE_FIELD_NAME} from 'sanity-plugin-internationalized-array'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {createMockSanityClient, ThemeWrapper} from '../test/component-helpers'
import {MOCK_PLUGIN_CONFIG} from '../test/helpers'
import {useDocumentInternationalizationContext} from './DocumentInternationalizationContext'
import LanguageManage from './LanguageManage'

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
let mockClient: ReturnType<typeof createMockSanityClient>

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    useClient: vi.fn(() => mockClient),
  }
})

const mockSchemaType: ObjectSchemaType = {
  name: 'article',
  type: 'document',
  jsonType: 'object',
  fields: [],
} as unknown as ObjectSchemaType

describe('LanguageManage', () => {
  beforeEach(() => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue(MOCK_PLUGIN_CONFIG)
    mockClient = createMockSanityClient()
    mockOpenInNewPane.mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('renders "Manage Translations" button', () => {
    render(
      <LanguageManage
        id="meta-1"
        metadataId="meta-1"
        schemaType={mockSchemaType}
        documentId="doc-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    expect(screen.getByText('Manage Translations')).toBeInTheDocument()
  })

  test('disables when no existing metadata id and creation not allowed', () => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue({
      ...MOCK_PLUGIN_CONFIG,
      allowCreateMetaDoc: false,
    })

    render(
      <LanguageManage
        id={undefined}
        metadataId="meta-1"
        schemaType={mockSchemaType}
        documentId="doc-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  test('disables when creation allowed but no source language', () => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue({
      ...MOCK_PLUGIN_CONFIG,
      allowCreateMetaDoc: true,
    })

    render(
      <LanguageManage
        id={undefined}
        metadataId="meta-1"
        schemaType={mockSchemaType}
        documentId="doc-1"
        sourceLanguageId={undefined}
      />,
      {wrapper: ThemeWrapper},
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  test('enables when metadata exists', () => {
    render(
      <LanguageManage
        id="meta-1"
        metadataId="meta-1"
        schemaType={mockSchemaType}
        documentId="doc-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
  })

  test('enables when creation allowed and source language exists', () => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue({
      ...MOCK_PLUGIN_CONFIG,
      allowCreateMetaDoc: true,
    })

    render(
      <LanguageManage
        id={undefined}
        metadataId="meta-1"
        schemaType={mockSchemaType}
        documentId="doc-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
  })

  test('opens existing metadata in new pane on click', () => {
    render(
      <LanguageManage
        id="meta-1"
        metadataId="meta-1"
        schemaType={mockSchemaType}
        documentId="doc-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    fireEvent.click(screen.getByRole('button'))

    expect(mockOpenInNewPane).toHaveBeenCalled()
  })

  test('creates metadata document when none exists and creation allowed', async () => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue({
      ...MOCK_PLUGIN_CONFIG,
      allowCreateMetaDoc: true,
    })

    render(
      <LanguageManage
        id={undefined}
        metadataId="meta-1"
        schemaType={mockSchemaType}
        documentId="doc-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockClient.transaction).toHaveBeenCalled()
    })
  })

  test('creates metadata document with source reference and schema type', async () => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue({
      ...MOCK_PLUGIN_CONFIG,
      allowCreateMetaDoc: true,
    })

    render(
      <LanguageManage
        id={undefined}
        metadataId="meta-1"
        schemaType={mockSchemaType}
        documentId="doc-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      const tx = mockClient.transaction()
      expect(tx.createIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'meta-1',
          _type: 'translation.metadata',
          schemaTypes: ['article'],
          translations: expect.arrayContaining([
            expect.objectContaining({
              [LANGUAGE_FIELD_NAME]: 'en',
              _key: expect.any(String),
              value: expect.objectContaining({_ref: 'doc-1'}),
            }),
          ]),
        }),
      )
    })
  })

  test('opens created metadata in new pane after successful creation', async () => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue({
      ...MOCK_PLUGIN_CONFIG,
      allowCreateMetaDoc: true,
    })

    render(
      <LanguageManage
        id={undefined}
        metadataId="meta-1"
        schemaType={mockSchemaType}
        documentId="doc-1"
        sourceLanguageId="en"
      />,
      {wrapper: ThemeWrapper},
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockOpenInNewPane).toHaveBeenCalled()
    })
  })
})
