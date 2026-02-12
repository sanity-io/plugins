import type {DocumentActionProps, SanityDocument} from 'sanity'

import {renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {useDocumentInternationalizationContext} from '../components/DocumentInternationalizationContext'
import {createMockSanityClient} from '../test/component-helpers'
import {createMockDocument, MOCK_PLUGIN_CONFIG} from '../test/helpers'
import {DeleteTranslationAction} from './DeleteTranslationAction'

// Mock dependencies
vi.mock('../components/DocumentInternationalizationContext', () => ({
  useDocumentInternationalizationContext: vi.fn(),
}))

vi.mock('../components/DeleteTranslationDialog', () => ({
  default: () => null,
}))

vi.mock('../components/DeleteTranslationFooter', () => ({
  default: () => null,
}))

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

function createActionProps(opts: {
  draft?: SanityDocument | null
  published?: SanityDocument | null
}): DocumentActionProps {
  return {
    id: opts.draft?._id?.replace('drafts.', '') ?? opts.published?._id ?? 'doc-1',
    type: 'article',
    draft: opts.draft ?? null,
    published: opts.published ?? null,
    liveEdit: false,
    onComplete: vi.fn(),
  } as unknown as DocumentActionProps
}

describe('DeleteTranslationAction', () => {
  beforeEach(() => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue(MOCK_PLUGIN_CONFIG)
    mockClient = createMockSanityClient()
    mockToastPush.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('returns action with correct label', () => {
    const draft = createMockDocument('drafts.doc-1', 'en')
    const props = createActionProps({draft})

    const {result} = renderHook(() => DeleteTranslationAction(props))

    expect(result.current.label).toBe('Delete translation...')
  })

  test('returns action with trash icon', () => {
    const draft = createMockDocument('drafts.doc-1', 'en')
    const props = createActionProps({draft})

    const {result} = renderHook(() => DeleteTranslationAction(props))

    expect(result.current.icon).toBeDefined()
  })

  test('returns action with critical tone', () => {
    const draft = createMockDocument('drafts.doc-1', 'en')
    const props = createActionProps({draft})

    const {result} = renderHook(() => DeleteTranslationAction(props))

    expect(result.current.tone).toBe('critical')
  })

  test('disables action when no document exists', () => {
    const props = createActionProps({draft: null, published: null})

    const {result} = renderHook(() => DeleteTranslationAction(props))

    expect(result.current.disabled).toBe(true)
  })

  test('disables action when document has no language field value', () => {
    const draft: SanityDocument = {
      _id: 'drafts.doc-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      // No language field
    }
    const props = createActionProps({draft})

    const {result} = renderHook(() => DeleteTranslationAction(props))

    expect(result.current.disabled).toBe(true)
  })

  test('enables action when document has language field value', () => {
    const draft = createMockDocument('drafts.doc-1', 'en')
    const props = createActionProps({draft})

    const {result} = renderHook(() => DeleteTranslationAction(props))

    expect(result.current.disabled).toBe(false)
  })

  test('uses published document when no draft exists', () => {
    const published = createMockDocument('doc-1', 'en')
    const props = createActionProps({draft: null, published})

    const {result} = renderHook(() => DeleteTranslationAction(props))

    expect(result.current.disabled).toBe(false)
  })

  test('prefers draft over published document', () => {
    const draft = createMockDocument('drafts.doc-1', 'fr')
    const published = createMockDocument('doc-1', 'en')
    const props = createActionProps({draft, published})

    const {result} = renderHook(() => DeleteTranslationAction(props))

    expect(result.current.disabled).toBe(false)
  })

  test('respects custom languageField from context', () => {
    vi.mocked(useDocumentInternationalizationContext).mockReturnValue({
      ...MOCK_PLUGIN_CONFIG,
      languageField: 'locale',
    })

    const draft: SanityDocument = {
      _id: 'drafts.doc-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      locale: 'en',
    }
    const props = createActionProps({draft})

    const {result} = renderHook(() => DeleteTranslationAction(props))

    expect(result.current.disabled).toBe(false)
  })

  test('disables when language field value is not a string', () => {
    const draft: SanityDocument = {
      _id: 'drafts.doc-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      language: 123,
    }
    const props = createActionProps({draft})

    const {result} = renderHook(() => DeleteTranslationAction(props))

    expect(result.current.disabled).toBe(true)
  })

  test('has onHandle function', () => {
    const draft = createMockDocument('drafts.doc-1', 'en')
    const props = createActionProps({draft})

    const {result} = renderHook(() => DeleteTranslationAction(props))

    expect(typeof result.current.onHandle).toBe('function')
  })
})
