import type {DocumentActionProps, SanityDocument} from 'sanity'

import {renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {TRANSLATIONS_ARRAY_NAME} from '../constants'
import {createMockSanityClient} from '../test/component-helpers'
import {DeleteMetadataAction} from './DeleteMetadataAction'

let mockClient: ReturnType<typeof createMockSanityClient>
const mockToastPush = vi.fn()

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

function createMetadataDocument(
  id: string,
  translations: Array<{_key: string; _type: string; value: {_type: string; _ref: string}}>,
): SanityDocument {
  return {
    _id: id,
    _type: 'translation.metadata',
    _rev: 'rev-1',
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
    [TRANSLATIONS_ARRAY_NAME]: translations,
  }
}

function createTranslationRef(languageId: string, ref: string) {
  return {
    _key: languageId,
    _type: 'internationalizedArrayReferenceValue',
    value: {
      _type: 'reference',
      _ref: ref,
    },
  }
}

function createActionProps(opts: {
  draft?: SanityDocument | null
  published?: SanityDocument | null
}): DocumentActionProps {
  return {
    id: opts.draft?._id?.replace('drafts.', '') ?? opts.published?._id ?? 'meta-1',
    type: 'translation.metadata',
    draft: opts.draft ?? null,
    published: opts.published ?? null,
    liveEdit: true,
    onComplete: vi.fn(),
  } as unknown as DocumentActionProps
}

describe('DeleteMetadataAction', () => {
  beforeEach(() => {
    mockClient = createMockSanityClient()
    mockToastPush.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('returns action with correct label', () => {
    const translations = [createTranslationRef('en', 'doc-1')]
    const published = createMetadataDocument('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => DeleteMetadataAction(props))

    expect(result.current.label).toBe('Delete all translations')
  })

  test('returns action with trash icon', () => {
    const translations = [createTranslationRef('en', 'doc-1')]
    const published = createMetadataDocument('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => DeleteMetadataAction(props))

    expect(result.current.icon).toBeDefined()
  })

  test('returns action with critical tone', () => {
    const translations = [createTranslationRef('en', 'doc-1')]
    const published = createMetadataDocument('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => DeleteMetadataAction(props))

    expect(result.current.tone).toBe('critical')
  })

  test('disables action when no document exists', () => {
    const props = createActionProps({draft: null, published: null})

    const {result} = renderHook(() => DeleteMetadataAction(props))

    expect(result.current.disabled).toBe(true)
  })

  test('disables action when translations array is empty', () => {
    const published = createMetadataDocument('meta-1', [])
    const props = createActionProps({published})

    const {result} = renderHook(() => DeleteMetadataAction(props))

    expect(result.current.disabled).toBe(true)
  })

  test('disables action when translations array is missing', () => {
    const published: SanityDocument = {
      _id: 'meta-1',
      _type: 'translation.metadata',
      _rev: 'rev-1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      // No translations array
    }
    const props = createActionProps({published})

    const {result} = renderHook(() => DeleteMetadataAction(props))

    expect(result.current.disabled).toBe(true)
  })

  test('enables action when document has translations', () => {
    const translations = [createTranslationRef('en', 'doc-1')]
    const published = createMetadataDocument('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => DeleteMetadataAction(props))

    expect(result.current.disabled).toBe(false)
  })

  test('uses draft over published document', () => {
    const draftTranslations = [
      createTranslationRef('en', 'doc-1'),
      createTranslationRef('fr', 'doc-2'),
    ]
    const publishedTranslations = [createTranslationRef('en', 'doc-1')]
    const draft = createMetadataDocument('drafts.meta-1', draftTranslations)
    const published = createMetadataDocument('meta-1', publishedTranslations)
    const props = createActionProps({draft, published})

    const {result} = renderHook(() => DeleteMetadataAction(props))

    // Draft has translations, so it should be enabled
    expect(result.current.disabled).toBe(false)
  })

  test('has onHandle function', () => {
    const translations = [createTranslationRef('en', 'doc-1')]
    const published = createMetadataDocument('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => DeleteMetadataAction(props))

    expect(typeof result.current.onHandle).toBe('function')
  })

  test('dialog is initially closed', () => {
    const translations = [createTranslationRef('en', 'doc-1')]
    const published = createMetadataDocument('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => DeleteMetadataAction(props))

    expect(result.current.dialog).toBeFalsy()
  })
})
