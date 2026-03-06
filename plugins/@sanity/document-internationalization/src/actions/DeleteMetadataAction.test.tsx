import {act, renderHook, waitFor} from '@testing-library/react'
/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import type {SanityDocument} from 'sanity'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {createMockSanityClient} from '../test/component-helpers'
import {createActionProps, createMockMetadata, createMockTranslation} from '../test/helpers'
import {useDeleteMetadataAction} from './DeleteMetadataAction'

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

describe('useDeleteMetadataAction', () => {
  beforeEach(() => {
    mockClient = createMockSanityClient()
    mockToastPush.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('returns action with correct label, icon and tone', () => {
    const translations = [createMockTranslation('en', 'doc-1')]
    const published = createMockMetadata('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => useDeleteMetadataAction(props))

    expect(result.current.label).toBe('Delete all translations')
    expect(result.current.icon).toBeDefined()
    expect(result.current.tone).toBe('critical')
  })

  test('disables action when no document exists', () => {
    const props = createActionProps({draft: null, published: null})

    const {result} = renderHook(() => useDeleteMetadataAction(props))

    expect(result.current.disabled).toBe(true)
  })

  test('disables action when translations array is empty', () => {
    const published = createMockMetadata('meta-1', [])
    const props = createActionProps({published})

    const {result} = renderHook(() => useDeleteMetadataAction(props))

    expect(result.current?.disabled).toBe(true)
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

    const {result} = renderHook(() => useDeleteMetadataAction(props))

    expect(result.current.disabled).toBe(true)
  })

  test('enables action when document has translations', () => {
    const translations = [createMockTranslation('en', 'doc-1')]
    const published = createMockMetadata('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => useDeleteMetadataAction(props))

    expect(result.current.disabled).toBe(false)
  })

  test('uses draft over published document', () => {
    const draftTranslations = [
      createMockTranslation('en', 'doc-1'),
      createMockTranslation('fr', 'doc-2'),
    ]
    const publishedTranslations = [createMockTranslation('en', 'doc-1')]
    const draft = createMockMetadata('drafts.meta-1', draftTranslations)
    const published = createMockMetadata('meta-1', publishedTranslations)
    const props = createActionProps({draft, published})

    const {result} = renderHook(() => useDeleteMetadataAction(props))

    // Draft has translations, so it should be enabled
    expect(result.current.disabled).toBe(false)
  })

  test('has onHandle function', () => {
    const translations = [createMockTranslation('en', 'doc-1')]
    const published = createMockMetadata('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => useDeleteMetadataAction(props))

    expect(typeof result.current.onHandle).toBe('function')
  })

  test('dialog is initially closed', () => {
    const translations = [createMockTranslation('en', 'doc-1')]
    const published = createMockMetadata('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => useDeleteMetadataAction(props))

    expect(result.current.dialog).toBeFalsy()
  })

  test('onHandle opens the confirmation dialog', () => {
    const translations = [createMockTranslation('en', 'doc-1')]
    const published = createMockMetadata('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => useDeleteMetadataAction(props))
    const onHandle = result.current.onHandle as () => void
    act(() => {
      onHandle()
    })

    expect(result.current.dialog).toBeTruthy()
    const dialog = result.current.dialog as {type: string; message: string}
    expect(dialog.type).toBe('confirm')
    expect(dialog.message).toBe('Delete 1 translation and this document')
  })

  test('dialog shows plural message for multiple translations', () => {
    const translations = [
      createMockTranslation('en', 'doc-1'),
      createMockTranslation('fr', 'doc-2'),
      createMockTranslation('es', 'doc-3'),
    ]
    const published = createMockMetadata('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => useDeleteMetadataAction(props))
    const onHandle = result.current.onHandle as () => void
    act(() => {
      onHandle()
    })

    const dialog = result.current.dialog as {message: string}
    expect(dialog.message).toBe('Delete all 3 translations and this document')
  })

  test('onConfirm deletes all translations and metadata document', async () => {
    const translations = [
      createMockTranslation('en', 'doc-1'),
      createMockTranslation('fr', 'doc-2'),
    ]
    const published = createMockMetadata('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => useDeleteMetadataAction(props))
    const onHandle = result.current.onHandle as () => void
    act(() => {
      onHandle()
    })

    const dialog = result.current.dialog as {onConfirm: () => void}
    await act(async () => {
      dialog.onConfirm()
    })

    const tx = mockClient.transaction()
    expect(tx.patch).toHaveBeenCalledWith('meta-1', expect.any(Function))
    expect(tx.delete).toHaveBeenCalledWith('doc-1')
    expect(tx.delete).toHaveBeenCalledWith('drafts.doc-1')
    expect(tx.delete).toHaveBeenCalledWith('doc-2')
    expect(tx.delete).toHaveBeenCalledWith('drafts.doc-2')
    expect(tx.delete).toHaveBeenCalledWith('meta-1')
    expect(tx.delete).toHaveBeenCalledWith('drafts.meta-1')
    expect(tx.commit).toHaveBeenCalled()
  })

  test('shows success toast after successful deletion', async () => {
    const translations = [createMockTranslation('en', 'doc-1')]
    const published = createMockMetadata('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => useDeleteMetadataAction(props))
    const onHandle = result.current.onHandle as () => void
    act(() => {
      onHandle()
    })

    const dialog = result.current.dialog as {onConfirm: () => void}
    await act(async () => {
      dialog.onConfirm()
    })

    await waitFor(() => {
      expect(mockToastPush).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          title: 'Deleted document and translations',
        }),
      )
    })
  })

  test('shows error toast when deletion fails', async () => {
    mockClient = createMockSanityClient()
    const tx = mockClient.transaction()
    tx.commit.mockRejectedValueOnce(new Error('Network error'))

    const translations = [createMockTranslation('en', 'doc-1')]
    const published = createMockMetadata('meta-1', translations)
    const props = createActionProps({published})

    const {result} = renderHook(() => useDeleteMetadataAction(props))
    const onHandle = result.current.onHandle as () => void
    act(() => {
      onHandle()
    })

    const dialog = result.current.dialog as {onConfirm: () => void}
    await act(async () => {
      dialog.onConfirm()
    })

    await waitFor(() => {
      expect(mockToastPush).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          title: 'Failed to delete document and translations',
          description: 'Network error',
        }),
      )
    })
  })
})
