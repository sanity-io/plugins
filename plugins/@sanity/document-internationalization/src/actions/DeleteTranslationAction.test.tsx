/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import type {ReactElement} from 'react'
import type {DocumentActionProps, SanityDocument} from 'sanity'

import {act, renderHook, waitFor} from '@testing-library/react'
import {LANGUAGE_FIELD_NAME} from 'sanity-plugin-internationalized-array'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import type {MetadataDocument} from '../types'

import {useDocumentInternationalizationContext} from '../components/DocumentInternationalizationContext'
import {createMockSanityClient} from '../test/component-helpers'
import {createMockDocument, MOCK_PLUGIN_CONFIG} from '../test/helpers'
import {useDeleteTranslationAction} from './DeleteTranslationAction'

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

  test('returns action with correct label, icon and tone', () => {
    const draft = createMockDocument('drafts.doc-1', 'en')
    const props = createActionProps({draft})

    const {result} = renderHook(() => useDeleteTranslationAction(props))

    expect(result.current.label).toBe('Delete translation...')
    expect(result.current.icon).toBeDefined()
    expect(result.current.tone).toBe('critical')
  })

  test('disables action when no document exists', () => {
    const props = createActionProps({draft: null, published: null})

    const {result} = renderHook(() => useDeleteTranslationAction(props))

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

    const {result} = renderHook(() => useDeleteTranslationAction(props))

    expect(result.current.disabled).toBe(true)
  })

  test('enables action when document has language field value', () => {
    const draft = createMockDocument('drafts.doc-1', 'en')
    const props = createActionProps({draft})

    const {result} = renderHook(() => useDeleteTranslationAction(props))

    expect(result.current.disabled).toBe(false)
  })

  test('uses published document when no draft exists', () => {
    const published = createMockDocument('doc-1', 'en')
    const props = createActionProps({draft: null, published})

    const {result} = renderHook(() => useDeleteTranslationAction(props))

    expect(result.current.disabled).toBe(false)
  })

  test('prefers draft over published document', () => {
    const draft = createMockDocument('drafts.doc-1', 'fr')
    const published = createMockDocument('doc-1', 'en')
    const props = createActionProps({draft, published})

    const {result} = renderHook(() => useDeleteTranslationAction(props))

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

    const {result} = renderHook(() => useDeleteTranslationAction(props))

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

    const {result} = renderHook(() => useDeleteTranslationAction(props))

    expect(result.current.disabled).toBe(true)
  })

  test('has onHandle function', () => {
    const draft = createMockDocument('drafts.doc-1', 'en')
    const props = createActionProps({draft})

    const {result} = renderHook(() => useDeleteTranslationAction(props))

    expect(typeof result.current.onHandle).toBe('function')
  })

  test('onProceed deletes document when there are no translation references', async () => {
    const tx = mockClient.transaction()
    const draft = createMockDocument('drafts.doc-1', 'en')
    const props = createActionProps({draft})
    const {result} = renderHook(() => useDeleteTranslationAction(props))

    act(() => {
      result.current.onHandle?.()
    })

    const dialog = result.current.dialog as {
      footer: ReactElement<{onProceed: () => void}>
    }

    await act(async () => {
      dialog.footer.props.onProceed()
    })

    expect(tx.delete).toHaveBeenCalledWith('doc-1')
    expect(tx.delete).toHaveBeenCalledWith('drafts.doc-1')
    expect(tx.patch).not.toHaveBeenCalled()
    expect(tx.commit).toHaveBeenCalled()

    await waitFor(() => {
      expect(mockToastPush).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          title: 'Document deleted',
        }),
      )
    })
  })

  test('onProceed unsets translation references when metadata translations exist', async () => {
    const tx = mockClient.transaction()
    const draft = createMockDocument('drafts.doc-1', 'en')
    const props = createActionProps({draft})
    const {result} = renderHook(() => useDeleteTranslationAction(props))

    act(() => {
      result.current.onHandle?.()
    })

    const dialog = result.current.dialog as {
      content: ReactElement<{setTranslations: (translations: unknown[]) => void}>
      footer: ReactElement<{onProceed: () => void}>
    }

    const translations: MetadataDocument[] = [
      {
        _id: 'meta-1',
        _type: 'translation.metadata',
        schemaTypes: ['article'],
        translations: [
          {
            [LANGUAGE_FIELD_NAME]: 'en',
            _type: 'internationalizedArrayReferenceValue',
            value: {_type: 'reference', _ref: 'doc-1'},
          },
        ],
      },
    ]

    act(() => {
      dialog.content.props.setTranslations(translations)
    })

    const updatedDialog = result.current.dialog as {
      footer: ReactElement<{onProceed: () => void}>
    }

    await act(async () => {
      updatedDialog.footer.props.onProceed()
    })

    expect(tx.patch).toHaveBeenCalledWith('meta-1', expect.any(Function))
    expect(tx.delete).not.toHaveBeenCalledWith('doc-1')
    expect(tx.delete).not.toHaveBeenCalledWith('drafts.doc-1')
    expect(tx.commit).toHaveBeenCalled()

    await waitFor(() => {
      expect(mockToastPush).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          title: 'Translation reference unset',
          description: 'The document can now be deleted',
        }),
      )
    })
  })

  test('onProceed unsets legacy translation references matched by _key', async () => {
    const tx = mockClient.transaction()
    const draft = createMockDocument('drafts.doc-1', 'en')
    const props = createActionProps({draft})
    const {result} = renderHook(() => useDeleteTranslationAction(props))

    act(() => {
      result.current.onHandle?.()
    })

    const dialog = result.current.dialog as {
      content: ReactElement<{setTranslations: (translations: unknown[]) => void}>
      footer: ReactElement<{onProceed: () => void}>
    }

    const translations: MetadataDocument[] = [
      {
        _id: 'meta-1',
        _type: 'translation.metadata',
        schemaTypes: ['article'],
        translations: [
          {
            _key: 'en',
            _type: 'internationalizedArrayReferenceValue',
            value: {_type: 'reference', _ref: 'doc-1'},
          },
        ],
      },
    ]

    act(() => {
      dialog.content.props.setTranslations(translations)
    })

    const updatedDialog = result.current.dialog as {
      footer: ReactElement<{onProceed: () => void}>
    }

    await act(async () => {
      updatedDialog.footer.props.onProceed()
    })

    expect(tx.patch).toHaveBeenCalledWith('meta-1', expect.any(Function))
    expect(tx.commit).toHaveBeenCalled()
  })
})
