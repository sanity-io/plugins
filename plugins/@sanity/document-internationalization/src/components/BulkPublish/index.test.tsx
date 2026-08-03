/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {useEffect} from 'react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {ThemeWrapper} from '../../test/component-helpers'
import {createMockTranslation} from '../../test/helpers'
import BulkPublish from './index'

const mockRequest = vi.fn()
const mockToastPush = vi.fn()
const mockUseWorkspace = vi.fn(() => ({projectId: 'project-1', dataset: 'production'}))

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    useClient: () => ({request: mockRequest}),
    useWorkspace: () => mockUseWorkspace(),
    TextWithTone: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
  }
})

vi.mock('@sanity/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sanity/ui')>()
  return {
    ...actual,
    useToast: () => ({push: mockToastPush}),
  }
})

function MockDocumentCheck({
  id,
  onCheckComplete,
  addDraftId,
  removeInvalidId,
}: {
  id: string
  onCheckComplete: (id: string) => void
  addDraftId: (id: string) => void
  removeInvalidId: (id: string) => void
}) {
  useEffect(() => {
    onCheckComplete(id)
    addDraftId(id)
    removeInvalidId(id)
  }, [id, onCheckComplete, addDraftId, removeInvalidId])

  return <div data-testid={`document-check-${id}`}>{id}</div>
}

vi.mock('./DocumentCheck', () => ({
  default: (props: {
    id: string
    onCheckComplete: (id: string) => void
    addDraftId: (id: string) => void
    removeInvalidId: (id: string) => void
  }) => <MockDocumentCheck {...props} />,
}))

vi.mock('./Info', () => ({
  default: () => <div data-testid="bulk-publish-info">info</div>,
}))

describe('BulkPublish', () => {
  beforeEach(() => {
    mockRequest.mockReset()
    mockToastPush.mockReset()
    mockRequest.mockResolvedValue({})
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('returns null when translations are empty', () => {
    const {container} = render(<BulkPublish translations={[]} />, {wrapper: ThemeWrapper})
    expect(container.firstChild).toBeNull()
  })

  test('renders prepare button and opens dialog', () => {
    const translations = [createMockTranslation('en', 'doc-1')]

    render(<BulkPublish translations={translations} />, {wrapper: ThemeWrapper})

    expect(screen.getByText('Bulk publishing')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'Prepare bulk publishing'}))
    expect(screen.getByText('There is 1 draft document.')).toBeInTheDocument()
    expect(screen.getByTestId('document-check-doc-1')).toBeInTheDocument()
  })

  test('filters out translations without a value._ref', () => {
    const withRef = createMockTranslation('en', 'doc-1')
    const withoutRef = {
      ...createMockTranslation('fr', 'doc-2'),
      value: {_type: 'reference' as const},
    }

    render(<BulkPublish translations={[withRef, withoutRef as never]} />, {wrapper: ThemeWrapper})

    fireEvent.click(screen.getByRole('button', {name: 'Prepare bulk publishing'}))
    expect(screen.getByTestId('document-check-doc-1')).toBeInTheDocument()
    expect(screen.queryByTestId('document-check-doc-2')).not.toBeInTheDocument()
  })

  test('publishes via Scheduling API and shows success toast', async () => {
    const translations = [
      createMockTranslation('en', 'doc-1'),
      createMockTranslation('fr', 'doc-2'),
    ]

    render(<BulkPublish translations={translations} />, {wrapper: ThemeWrapper})
    fireEvent.click(screen.getByRole('button', {name: 'Prepare bulk publishing'}))

    const publishButton = screen.getByRole('button', {name: /Bulk publish 2 draft documents/})
    expect(publishButton).not.toBeDisabled()
    fireEvent.click(publishButton)

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith({
        uri: '/publish/project-1/production',
        method: 'POST',
        body: [{documentId: 'doc-1'}, {documentId: 'doc-2'}],
      })
      expect(mockToastPush).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          title: 'Success',
          description: 'Bulk publish complete',
        }),
      )
    })
  })

  test('shows error toast when publish request fails', async () => {
    mockRequest.mockRejectedValue(new Error('API unavailable'))
    const translations = [createMockTranslation('en', 'doc-1')]

    render(<BulkPublish translations={translations} />, {wrapper: ThemeWrapper})
    fireEvent.click(screen.getByRole('button', {name: 'Prepare bulk publishing'}))
    fireEvent.click(screen.getByRole('button', {name: /Publish draft document/}))

    await waitFor(() => {
      expect(mockToastPush).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          title: 'Error',
          description: 'Bulk publish failed',
        }),
      )
    })
  })
})
