import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {type SanityDocument} from 'sanity'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {createMockSanityClient, ThemeWrapper} from '../test/component-helpers'
import {createMockDocument, MOCK_PLUGIN_CONFIG} from '../test/helpers'
import type {Language} from '../types'
import {useDocumentInternationalizationContext} from './DocumentInternationalizationContext'
import LanguagePatch from './LanguagePatch'

// Mock the context
vi.mock('./DocumentInternationalizationContext', () => ({
  useDocumentInternationalizationContext: vi.fn(),
}))

// Mock sanity's useClient and useToast
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

describe('LanguagePatch', () => {
  const mockLanguage: Language = {id: 'fr', title: 'French'}

  beforeEach(() => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue(MOCK_PLUGIN_CONFIG)
    mockClient = createMockSanityClient()
    mockToastPush.mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('renders language title', () => {
    const source = createMockDocument('doc-1', 'en')
    render(<LanguagePatch language={mockLanguage} source={source} disabled={false} />, {
      wrapper: ThemeWrapper,
    })

    expect(screen.getByText('French')).toBeInTheDocument()
  })

  test('renders language id in badge', () => {
    const source = createMockDocument('doc-1', 'en')
    render(<LanguagePatch language={mockLanguage} source={source} disabled={false} />, {
      wrapper: ThemeWrapper,
    })

    expect(screen.getByText('fr')).toBeInTheDocument()
  })

  test('disables button when source is null', () => {
    render(<LanguagePatch language={mockLanguage} source={null} disabled={false} />, {
      wrapper: ThemeWrapper,
    })

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-disabled', 'true')
  })

  test('disables button when disabled prop is true', () => {
    const source = createMockDocument('doc-1', 'en')
    render(<LanguagePatch language={mockLanguage} source={source} disabled={true} />, {
      wrapper: ThemeWrapper,
    })

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-disabled', 'true')
  })

  test('enables button when source exists and disabled is false', () => {
    const source = createMockDocument('doc-1', 'en')
    render(<LanguagePatch language={mockLanguage} source={source} disabled={false} />, {
      wrapper: ThemeWrapper,
    })

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('data-disabled', 'false')
  })

  test('calls client.patch with correct language on click', async () => {
    const source = createMockDocument('doc-1', 'en')
    render(<LanguagePatch language={mockLanguage} source={source} disabled={false} />, {
      wrapper: ThemeWrapper,
    })

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockClient.patch).toHaveBeenCalledWith('doc-1')
    })

    const patchMock = mockClient.patch('doc-1')
    expect(patchMock.set).toHaveBeenCalledWith({language: 'fr'})
    expect(patchMock.commit).toHaveBeenCalled()
  })

  test('shows success toast on patch success', async () => {
    const source = createMockDocument('doc-1', 'en')
    render(<LanguagePatch language={mockLanguage} source={source} disabled={false} />, {
      wrapper: ThemeWrapper,
    })

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockToastPush).toHaveBeenCalledWith({
        title: 'Set document language to French',
        status: 'success',
      })
    })
  })

  test('shows error toast on patch failure', async () => {
    mockClient = createMockSanityClient()
    const patchMock = mockClient.patch('any')
    vi.mocked(patchMock.commit).mockRejectedValueOnce(new Error('Network error'))

    const source = createMockDocument('doc-1', 'en')
    render(<LanguagePatch language={mockLanguage} source={source} disabled={false} />, {
      wrapper: ThemeWrapper,
    })

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockToastPush).toHaveBeenCalledWith({
        title: 'Failed to set document language to French',
        status: 'error',
      })
    })
  })

  test('uses custom languageField from context', async () => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue({
      ...MOCK_PLUGIN_CONFIG,
      languageField: 'locale',
    })

    mockClient = createMockSanityClient()

    const source: SanityDocument = {
      _id: 'doc-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      locale: 'en',
    }

    render(<LanguagePatch language={mockLanguage} source={source} disabled={false} />, {
      wrapper: ThemeWrapper,
    })

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockClient.patch).toHaveBeenCalledWith('doc-1')
    })

    // Get the patch mock that was created when patch() was called
    const patchMock = mockClient.patch.mock.results[0]?.value
    expect(patchMock.set).toHaveBeenCalledWith({locale: 'fr'})
  })
})
