/* oxlint-disable typescript-eslint/no-unsafe-type-assertion, typescript-eslint/no-deprecated */
import type {DocumentActionProps} from 'sanity'

import {act, renderHook, waitFor} from '@testing-library/react'
import {of} from 'rxjs'
import {LANGUAGE_FIELD_NAME} from 'sanity-plugin-internationalized-array'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {createMockSanityClient} from '../test/component-helpers'
import {createMockMetadata, createMockTranslation} from '../test/helpers'
import {useDuplicateWithTranslationsAction} from './DuplicateWithTranslationsAction'

// Mock the translation metadata hook
const mockTranslationMetadata = vi.fn()
vi.mock('../hooks/useLanguageMetadata', () => ({
  useTranslationMetadata: () => mockTranslationMetadata(),
}))

// Mock sanity module
let mockClient: ReturnType<typeof createMockSanityClient>
const mockDuplicateExecute = vi.fn()
const mockDuplicateDisabled = vi.fn<() => string | false>(() => false)
const mockNavigateIntent = vi.fn()
const mockPermissions = vi.fn<() => {granted: boolean}>(() => ({granted: true}))
const mockPermissionsLoading = vi.fn<() => boolean>(() => false)
const mockEditOperations = vi.fn()
const mockOperationEvents = vi.fn()

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    useClient: vi.fn(() => mockClient),
    useCurrentUser: vi.fn(() => ({id: 'user-1', name: 'Test User'})),
    useDocumentOperation: vi.fn(() => ({
      duplicate: {
        disabled: mockDuplicateDisabled(),
        execute: mockDuplicateExecute,
      },
    })),
    useDocumentPairPermissions: vi.fn(() => [mockPermissions(), mockPermissionsLoading()]),
    useDocumentStore: vi.fn(() => ({
      pair: {
        editOperations: mockEditOperations,
        operationEvents: mockOperationEvents,
      },
    })),
    useTranslation: vi.fn(() => ({t: (key: string) => key})),
  }
})

vi.mock('sanity/router', () => ({
  useRouter: vi.fn(() => ({navigateIntent: mockNavigateIntent})),
}))

vi.mock('sanity/structure', () => ({
  structureLocaleNamespace: 'structure',
}))

const mockToastPush = vi.fn()
vi.mock('@sanity/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sanity/ui')>()
  return {
    ...actual,
    useToast: () => ({push: mockToastPush}),
  }
})

function createActionProps(id = 'doc-1', type = 'article'): DocumentActionProps {
  return {
    id,
    type,
    draft: null,
    published: null,
    liveEdit: false,
    onComplete: vi.fn(),
  } as unknown as DocumentActionProps
}

describe('useDuplicateWithTranslationsAction', () => {
  beforeEach(() => {
    mockClient = createMockSanityClient()
    mockToastPush.mockClear()
    mockDuplicateExecute.mockClear()
    mockNavigateIntent.mockClear()
    mockDuplicateDisabled.mockReturnValue(false)
    mockPermissions.mockReturnValue({granted: true})
    mockPermissionsLoading.mockReturnValue(false)
    mockEditOperations.mockReset()
    mockOperationEvents.mockReset()

    // Default: metadata document exists
    const translations = [
      {
        ...createMockTranslation('en', 'doc-1'),
        [LANGUAGE_FIELD_NAME]: 'en',
      },
    ]
    const metadata = createMockMetadata('meta-1', translations)
    mockTranslationMetadata.mockReturnValue({data: [metadata], loading: false})

    const executeDocDuplicate = vi.fn()
    const executeMetadataDuplicate = vi.fn()
    mockEditOperations.mockImplementation((docId: string, docType: string) => {
      if (docId === 'meta-1' && docType === 'translation.metadata') {
        return of({
          duplicate: {
            disabled: false,
            execute: executeMetadataDuplicate,
          },
        })
      }

      return of({
        duplicate: {
          disabled: false,
          execute: executeDocDuplicate,
        },
      })
    })
    mockOperationEvents.mockReturnValue(of({op: 'duplicate', type: 'success'}))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('returns action with correct label', () => {
    const props = createActionProps()

    const {result} = renderHook(() => useDuplicateWithTranslationsAction(props))

    expect(result.current.label).toBe('action.duplicate.label')
  })

  test('returns action with copy icon', () => {
    const props = createActionProps()

    const {result} = renderHook(() => useDuplicateWithTranslationsAction(props))

    expect(result.current.icon).toBeDefined()
  })

  test('disables action when user lacks permission', () => {
    mockPermissions.mockReturnValue({granted: false})
    mockPermissionsLoading.mockReturnValue(false)
    const props = createActionProps()

    const {result} = renderHook(() => useDuplicateWithTranslationsAction(props))

    expect(result.current.disabled).toBe(true)
  })

  test('disables action when permissions are loading', () => {
    mockPermissionsLoading.mockReturnValue(true)
    const props = createActionProps()

    const {result} = renderHook(() => useDuplicateWithTranslationsAction(props))

    expect(result.current.disabled).toBe(true)
  })

  test('disables action when metadata is loading', () => {
    mockTranslationMetadata.mockReturnValue({data: null, loading: true})
    const props = createActionProps()

    const {result} = renderHook(() => useDuplicateWithTranslationsAction(props))

    expect(result.current.disabled).toBe(true)
  })

  test('disables action when no metadata document exists', () => {
    mockTranslationMetadata.mockReturnValue({data: [], loading: false})
    const props = createActionProps()

    const {result} = renderHook(() => useDuplicateWithTranslationsAction(props))

    expect(result.current.disabled).toBe(true)
    expect(result.current.title).toBe('action.duplicate.disabled.missing-metadata')
  })

  test('disables action when multiple metadata documents exist', () => {
    const translations = [createMockTranslation('en', 'doc-1')]
    const metadata1 = createMockMetadata('meta-1', translations)
    const metadata2 = createMockMetadata('meta-2', translations)
    mockTranslationMetadata.mockReturnValue({data: [metadata1, metadata2], loading: false})
    const props = createActionProps()

    const {result} = renderHook(() => useDuplicateWithTranslationsAction(props))

    expect(result.current.disabled).toBe(true)
    expect(result.current.title).toBe('action.duplicate.disabled.multiple-metadata')
  })

  test('disables action when duplicate operation is disabled', () => {
    mockDuplicateDisabled.mockReturnValue('NOTHING_TO_DUPLICATE')
    const props = createActionProps()

    const {result} = renderHook(() => useDuplicateWithTranslationsAction(props))

    expect(result.current.disabled).toBe(true)
  })

  test('enables action when metadata exists and user has permission', () => {
    const props = createActionProps()

    const {result} = renderHook(() => useDuplicateWithTranslationsAction(props))

    expect(result.current.disabled).toBe(false)
  })

  test('has onHandle function when enabled', () => {
    const props = createActionProps()

    const {result} = renderHook(() => useDuplicateWithTranslationsAction(props))

    expect(typeof result.current.onHandle).toBe('function')
  })

  test('onHandle duplicates translations and metadata, patches refs, navigates and calls onComplete', async () => {
    const props = createActionProps()
    const tx = mockClient.transaction()
    const {result} = renderHook(() => useDuplicateWithTranslationsAction(props))

    await act(async () => {
      result.current.onHandle?.()
    })

    await waitFor(() => {
      expect(mockEditOperations).toHaveBeenCalled()
      expect(mockOperationEvents).toHaveBeenCalled()
      expect(tx.patch).toHaveBeenCalled()
      expect(tx.commit).toHaveBeenCalled()
      expect(mockNavigateIntent).toHaveBeenCalledWith(
        'edit',
        expect.objectContaining({type: 'article'}),
      )
      expect(props.onComplete).toHaveBeenCalled()
    })
  })

  test('onHandle shows error toast when duplication fails', async () => {
    mockEditOperations.mockReturnValue(
      of({
        duplicate: {
          disabled: 'NO_PERMISSION',
          execute: vi.fn(),
        },
      }),
    )

    const props = createActionProps()
    const {result} = renderHook(() => useDuplicateWithTranslationsAction(props))

    await act(async () => {
      result.current.onHandle?.()
    })

    await waitFor(() => {
      expect(mockToastPush).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          title: 'Error duplicating document',
          description: 'Cannot duplicate document',
        }),
      )
    })
  })

  test('onHandle supports legacy translation items keyed by _key without language field', async () => {
    const legacyTranslations = [createMockTranslation('en', 'doc-1')]
    const metadata = createMockMetadata('meta-1', legacyTranslations)
    mockTranslationMetadata.mockReturnValue({data: [metadata], loading: false})

    const props = createActionProps()
    const tx = mockClient.transaction()
    const {result} = renderHook(() => useDuplicateWithTranslationsAction(props))

    await act(async () => {
      result.current.onHandle?.()
    })

    await waitFor(() => {
      expect(tx.patch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          set: expect.objectContaining({
            [`translations[${LANGUAGE_FIELD_NAME} == "en"].value._ref`]: expect.any(String),
          }),
        }),
      )
      expect(props.onComplete).toHaveBeenCalled()
    })
  })

  test('has static action property set to duplicate', () => {
    expect(useDuplicateWithTranslationsAction.action).toBe('duplicate')
  })

  test('has static displayName property', () => {
    expect(useDuplicateWithTranslationsAction.displayName).toBe('DuplicateWithTranslationsAction')
  })
})
