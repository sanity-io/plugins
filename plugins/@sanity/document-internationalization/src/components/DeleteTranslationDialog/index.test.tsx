import {cleanup, render, screen} from '@testing-library/react'
import type {SanityDocument} from 'sanity'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {ThemeWrapper} from '../../test/component-helpers'
import {createMockDocument, createMockMetadata, createMockTranslation} from '../../test/helpers'
import DeleteTranslationDialog from './index'

const mockUseListeningQuery = vi.fn()

vi.mock('sanity-plugin-utils', () => ({
  useListeningQuery: (...args: unknown[]) => mockUseListeningQuery(...args),
  Feedback: ({title}: {title: string}) => <div data-testid="feedback">{title}</div>,
}))

vi.mock('./DocumentPreview', () => ({
  default: ({value, type}: {value: {_id?: string}; type: string}) => (
    <div data-testid={`preview-${type}`}>{value?._id ?? 'unknown'}</div>
  ),
}))

describe('DeleteTranslationDialog', () => {
  const doc = createMockDocument('doc-1', 'en')
  const setTranslations = vi.fn()

  beforeEach(() => {
    setTranslations.mockClear()
    mockUseListeningQuery.mockReturnValue({data: [], loading: false})
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('shows spinner while references are loading', () => {
    mockUseListeningQuery.mockReturnValue({data: [], loading: true})

    const {container} = render(
      <DeleteTranslationDialog doc={doc} documentId="doc-1" setTranslations={setTranslations} />,
      {wrapper: ThemeWrapper},
    )

    expect(container.querySelector('[data-ui="Spinner"]')).toBeInTheDocument()
  })

  test('shows copy when document has no connected translations', () => {
    mockUseListeningQuery.mockReturnValue({data: [], loading: false})

    render(
      <DeleteTranslationDialog doc={doc} documentId="doc-1" setTranslations={setTranslations} />,
      {wrapper: ThemeWrapper},
    )

    expect(
      screen.getByText('This document does not have connected translations.'),
    ).toBeInTheDocument()
    expect(screen.getByText('This document can now be deleted')).toBeInTheDocument()
    expect(screen.getByText('This document has no other references.')).toBeInTheDocument()
    expect(setTranslations).toHaveBeenCalledWith([])
  })

  test('lists metadata translations that must be unset', () => {
    const metadata = createMockMetadata('meta-1', [createMockTranslation('en', 'doc-1')])
    mockUseListeningQuery.mockReturnValue({data: [metadata], loading: false})

    render(
      <DeleteTranslationDialog doc={doc} documentId="doc-1" setTranslations={setTranslations} />,
      {wrapper: ThemeWrapper},
    )

    expect(
      screen.getByText(
        'This document is a language-specific version which other translations depend on.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Before this document can be deleted')).toBeInTheDocument()
    expect(screen.getByText(/this translations document/)).toBeInTheDocument()
    expect(screen.getByTestId('preview-translation.metadata')).toHaveTextContent('meta-1')
    expect(setTranslations).toHaveBeenCalledWith([metadata])
  })

  test('warns about additional non-metadata references', () => {
    const otherRef: SanityDocument = {
      _id: 'other-1',
      _type: 'page',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
    }
    mockUseListeningQuery.mockReturnValue({data: [otherRef], loading: false})

    render(
      <DeleteTranslationDialog doc={doc} documentId="doc-1" setTranslations={setTranslations} />,
      {wrapper: ThemeWrapper},
    )

    expect(screen.getByText(/There is an additional reference/)).toBeInTheDocument()
    expect(
      screen.getByText(/You may not be able to delete this document because other documents refer/),
    ).toBeInTheDocument()
    expect(screen.getByTestId('preview-page')).toHaveTextContent('other-1')
  })

  test('queries inbound references with the document id', () => {
    render(
      <DeleteTranslationDialog doc={doc} documentId="doc-1" setTranslations={setTranslations} />,
      {wrapper: ThemeWrapper},
    )

    expect(mockUseListeningQuery).toHaveBeenCalledWith(
      `*[references($id)]{_id, _type, translations}`,
      expect.objectContaining({params: {id: 'doc-1'}}),
    )
  })
})
