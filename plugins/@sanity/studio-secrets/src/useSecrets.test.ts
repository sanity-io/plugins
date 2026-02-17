import {act, renderHook, waitFor} from '@testing-library/react'
import {BehaviorSubject, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {useSecrets} from './useSecrets'

// --- Mocks ---

const mockSet = vi.fn()
const mockPatch = vi.fn()
const mockCreateIfNotExists = vi.fn()
const mockCommit = vi.fn()
const mockTransactionPatch = vi.fn()

const mockObserveDocument = vi.fn()

const mockClient = {
  patch: mockPatch,
  transaction: vi.fn(),
}

vi.mock('sanity', () => ({
  useClient: () => mockClient,
  useDocumentPreviewStore: () => ({
    unstable_observeDocument: mockObserveDocument,
  }),
}))

beforeEach(() => {
  mockSet.mockReturnValue({toJSON: () => ({})})
  mockPatch.mockReturnValue({set: mockSet})
  mockTransactionPatch.mockReturnValue({commit: mockCommit})
  mockCreateIfNotExists.mockReturnValue({patch: mockTransactionPatch})
  mockClient.transaction.mockReturnValue({createIfNotExists: mockCreateIfNotExists})
  mockCommit.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * Helper: create a BehaviorSubject that emits a document synchronously.
 * useObservable eagerly subscribes on init, so BehaviorSubject ensures
 * the value is captured during the first render.
 */
function mockDocumentWithValue(doc: Record<string, unknown> | undefined) {
  const subject = new BehaviorSubject<Record<string, unknown> | undefined>(doc)
  mockObserveDocument.mockReturnValue(subject.asObservable())
  return subject
}

/**
 * Helper: create a Subject that starts with no value (loading state).
 * Useful for tests that need to control emission timing.
 */
function mockDocumentDeferred() {
  const subject = new Subject<Record<string, unknown> | undefined>()
  mockObserveDocument.mockReturnValue(subject.asObservable())
  return subject
}

describe('useSecrets', () => {
  test('starts in loading state', () => {
    mockDocumentDeferred()

    const {result} = renderHook(() => useSecrets('my-plugin'))

    expect(result.current.loading).toBe(true)
    expect(result.current.secrets).toBeUndefined()
  })

  test('observes the correct document ID', () => {
    mockDocumentDeferred()

    renderHook(() => useSecrets('my-plugin'))

    expect(mockObserveDocument).toHaveBeenCalledWith('secrets.my-plugin')
  })

  test('sets loading to false after first emission', () => {
    mockDocumentWithValue(undefined)

    const {result} = renderHook(() => useSecrets('my-plugin'))

    expect(result.current.loading).toBe(false)
  })

  test('populates secrets from document', () => {
    mockDocumentWithValue({
      _id: 'secrets.my-plugin',
      secrets: {apiKey: 'abc123', token: 'xyz'},
    })

    const {result} = renderHook(() => useSecrets<Record<string, string>>('my-plugin'))

    expect(result.current.loading).toBe(false)
    expect(result.current.secrets).toEqual({apiKey: 'abc123', token: 'xyz'})
  })

  test('handles undefined document (no secrets stored yet)', () => {
    mockDocumentWithValue(undefined)

    const {result} = renderHook(() => useSecrets('my-plugin'))

    expect(result.current.loading).toBe(false)
    expect(result.current.secrets).toBeUndefined()
  })

  test('handles document without secrets field', () => {
    mockDocumentWithValue({_id: 'secrets.my-plugin', _type: 'pluginSecrets'})

    const {result} = renderHook(() => useSecrets('my-plugin'))

    expect(result.current.loading).toBe(false)
    expect(result.current.secrets).toBeUndefined()
  })

  test('updates secrets when document changes', async () => {
    const subject = mockDocumentWithValue({
      _id: 'secrets.my-plugin',
      secrets: {apiKey: 'old'},
    })

    const {result} = renderHook(() => useSecrets<Record<string, string>>('my-plugin'))
    expect(result.current.secrets).toEqual({apiKey: 'old'})

    act(() => {
      subject.next({_id: 'secrets.my-plugin', secrets: {apiKey: 'new-value'}})
    })

    await waitFor(() => {
      expect(result.current.secrets).toEqual({apiKey: 'new-value'})
    })
  })

  test('uses different document IDs for different namespaces', () => {
    mockDocumentDeferred()
    mockObserveDocument.mockClear()

    renderHook(() => useSecrets('plugin-a'))
    expect(mockObserveDocument).toHaveBeenCalledWith('secrets.plugin-a')

    mockObserveDocument.mockClear()

    renderHook(() => useSecrets('plugin-b'))
    expect(mockObserveDocument).toHaveBeenCalledWith('secrets.plugin-b')
  })

  test('deduplication is handled by documentPreviewStore', () => {
    mockDocumentDeferred()
    mockObserveDocument.mockClear()

    // Two hooks with the same namespace both call unstable_observeDocument
    // with the same ID — the store handles dedup internally via memoization
    renderHook(() => useSecrets('dedup-ns'))
    renderHook(() => useSecrets('dedup-ns'))

    expect(mockObserveDocument).toHaveBeenCalledTimes(2)
    expect(mockObserveDocument).toHaveBeenCalledWith('secrets.dedup-ns')
  })

  test('both subscribers receive document updates', async () => {
    const subject = mockDocumentWithValue(undefined)

    const {result: result1} = renderHook(() => useSecrets<Record<string, string>>('shared-ns'))
    const {result: result2} = renderHook(() => useSecrets<Record<string, string>>('shared-ns'))

    expect(result1.current.loading).toBe(false)
    expect(result2.current.loading).toBe(false)

    act(() => {
      subject.next({_id: 'secrets.shared-ns', secrets: {key: 'shared-value'}})
    })

    await waitFor(() => {
      expect(result1.current.secrets).toEqual({key: 'shared-value'})
      expect(result2.current.secrets).toEqual({key: 'shared-value'})
    })
  })

  describe('storeSecrets', () => {
    test('stores secrets via transaction', () => {
      mockDocumentWithValue(undefined)

      const {result} = renderHook(() => useSecrets<Record<string, string>>('my-plugin'))
      expect(result.current.loading).toBe(false)

      act(() => {
        result.current.storeSecrets({apiKey: 'new-secret'})
      })

      expect(mockClient.transaction).toHaveBeenCalled()
      expect(mockCreateIfNotExists).toHaveBeenCalledWith({
        _id: 'secrets.my-plugin',
        _type: 'pluginSecrets',
      })
      expect(mockPatch).toHaveBeenCalledWith('secrets.my-plugin')
      expect(mockSet).toHaveBeenCalledWith({secrets: {apiKey: 'new-secret'}})
      const keysPatch = mockSet.mock.results[0]?.value
      expect(mockTransactionPatch).toHaveBeenCalledWith(keysPatch)
    })

    test('resets loading to false when commit fails', async () => {
      mockCommit.mockRejectedValue(new Error('Network error'))
      mockDocumentWithValue(undefined)

      const {result} = renderHook(() => useSecrets<Record<string, string>>('my-plugin'))
      expect(result.current.loading).toBe(false)

      act(() => {
        result.current.storeSecrets({apiKey: 'will-fail'})
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    test('sets loading to true while storing', async () => {
      let resolveCommit: () => void
      mockCommit.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveCommit = resolve
        }),
      )
      mockDocumentWithValue(undefined)

      const {result} = renderHook(() => useSecrets<Record<string, string>>('my-plugin'))
      expect(result.current.loading).toBe(false)

      act(() => {
        result.current.storeSecrets({apiKey: 'test'})
      })

      expect(result.current.loading).toBe(true)

      await act(async () => {
        resolveCommit!()
      })

      expect(result.current.loading).toBe(false)
    })
  })
})
