import {act, renderHook, waitFor} from '@testing-library/react'
import {Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {useSecrets} from './useSecrets'

// --- Mocks ---

const mockFetch = vi.fn()
const mockListen = vi.fn()
const mockSet = vi.fn()
const mockPatch = vi.fn()
const mockCreateIfNotExists = vi.fn()
const mockCommit = vi.fn()
const mockTransactionPatch = vi.fn()

// RxJS Subject that acts as the SSE stream — tests push events into it
let listenSubject: Subject<Record<string, unknown>>

const mockClient = {
  fetch: mockFetch,
  observable: {
    listen: mockListen,
  },
  patch: mockPatch,
  transaction: vi.fn(),
  config: () => ({projectId: 'test-project', dataset: 'test-dataset'}),
}

vi.mock('sanity', () => ({
  useClient: () => mockClient,
}))

beforeEach(() => {
  listenSubject = new Subject<Record<string, unknown>>()

  mockListen.mockImplementation(() => listenSubject.asObservable())

  mockFetch.mockResolvedValue(null)

  mockSet.mockReturnValue({toJSON: () => ({})})
  mockPatch.mockReturnValue({set: mockSet})
  mockTransactionPatch.mockReturnValue({commit: mockCommit})
  mockCreateIfNotExists.mockReturnValue({patch: mockTransactionPatch})
  mockClient.transaction.mockReturnValue({createIfNotExists: mockCreateIfNotExists})
  mockCommit.mockResolvedValue(undefined)
})

afterEach(() => {
  // Complete the subject to tear down shared listeners between tests
  listenSubject.complete()
  vi.restoreAllMocks()
})

describe('useSecrets', () => {
  test('starts in loading state', () => {
    const {result} = renderHook(() => useSecrets('my-plugin'))

    expect(result.current.loading).toBe(true)
    expect(result.current.secrets).toBeUndefined()
  })

  test('fetches secrets for the given namespace', () => {
    renderHook(() => useSecrets('my-plugin'))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      {id: 'secrets.my-plugin'},
      {tag: 'secrets.get'},
    )
  })

  test('sets loading to false after fetch completes', async () => {
    mockFetch.mockResolvedValue(null)

    const {result} = renderHook(() => useSecrets('my-plugin'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  test('populates secrets from fetch response', async () => {
    mockFetch.mockResolvedValue({secrets: {apiKey: 'abc123', token: 'xyz'}})

    const {result} = renderHook(() => useSecrets<Record<string, string>>('my-plugin'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.secrets).toEqual({apiKey: 'abc123', token: 'xyz'})
  })

  test('handles null fetch response (no secrets stored yet)', async () => {
    mockFetch.mockResolvedValue(null)

    const {result} = renderHook(() => useSecrets('my-plugin'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.secrets).toBeUndefined()
  })

  test('subscribes to real-time updates via listen', () => {
    renderHook(() => useSecrets('my-plugin'))

    expect(mockListen).toHaveBeenCalledWith(
      expect.any(String),
      {id: 'secrets.my-plugin'},
      {visibility: 'query', tag: 'secrets.listen'},
    )
  })

  test('updates secrets when SSE listener fires', async () => {
    mockFetch.mockResolvedValue({secrets: {apiKey: 'old'}})

    const {result} = renderHook(() => useSecrets<Record<string, string>>('my-plugin'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Simulate an SSE event with updated secrets
    act(() => {
      listenSubject.next({result: {secrets: {apiKey: 'new-value'}}})
    })

    expect(result.current.secrets).toEqual({apiKey: 'new-value'})
  })

  test('unsubscribes from listener on unmount', async () => {
    mockFetch.mockResolvedValue(null)

    const {unmount} = renderHook(() => useSecrets('my-plugin'))

    // Wait for fetch to complete so concat subscribes to the SSE stream
    await waitFor(() => {
      expect(listenSubject.observed).toBe(true)
    })

    unmount()

    // react-rx teardown is asynchronous (share uses timer(0, asapScheduler))
    await waitFor(() => {
      expect(listenSubject.observed).toBe(false)
    })
  })

  test('uses different document IDs for different namespaces', () => {
    renderHook(() => useSecrets('plugin-a'))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      {id: 'secrets.plugin-a'},
      expect.any(Object),
    )

    mockFetch.mockClear()
    mockListen.mockClear()

    renderHook(() => useSecrets('plugin-b'))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      {id: 'secrets.plugin-b'},
      expect.any(Object),
    )
  })

  test('deduplicates both fetch and SSE for the same namespace', async () => {
    mockFetch.mockClear()
    mockListen.mockClear()
    mockFetch.mockResolvedValue({secrets: {key: 'value'}})

    const {result: result1} = renderHook(() => useSecrets<Record<string, string>>('dedup-ns'))

    // Wait for first subscriber's fetch to complete
    await waitFor(() => {
      expect(result1.current.loading).toBe(false)
    })

    // Second subscriber with the same namespace — should reuse the shared stream
    const {result: result2} = renderHook(() => useSecrets<Record<string, string>>('dedup-ns'))

    // Second subscriber gets the replayed value immediately, no new fetch
    await waitFor(() => {
      expect(result2.current.loading).toBe(false)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockListen).toHaveBeenCalledTimes(1)
    expect(result2.current.secrets).toEqual({key: 'value'})
  })

  test('creates separate streams for different client configs (multi-workspace)', () => {
    mockFetch.mockClear()
    mockListen.mockClear()

    // First hook uses the default test-project/test-dataset config
    renderHook(() => useSecrets('same-ns'))

    // Change the client config to simulate a different workspace
    mockClient.config = () => ({projectId: 'project-b', dataset: 'dataset-b'})

    renderHook(() => useSecrets('same-ns'))

    // Both fetch and listen should be called twice — different client configs
    // mean separate streams even though the namespace is the same
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockListen).toHaveBeenCalledTimes(2)

    // Restore original config for other tests
    mockClient.config = () => ({projectId: 'test-project', dataset: 'test-dataset'})
  })

  test('both subscribers receive SSE events from shared listener', async () => {
    mockFetch.mockResolvedValue(null)

    const {result: result1} = renderHook(() => useSecrets<Record<string, string>>('shared-ns'))
    const {result: result2} = renderHook(() => useSecrets<Record<string, string>>('shared-ns'))

    await waitFor(() => {
      expect(result1.current.loading).toBe(false)
      expect(result2.current.loading).toBe(false)
    })

    act(() => {
      listenSubject.next({result: {secrets: {key: 'shared-value'}}})
    })

    expect(result1.current.secrets).toEqual({key: 'shared-value'})
    expect(result2.current.secrets).toEqual({key: 'shared-value'})
  })

  test('remounting a second subscriber does not re-fetch (dialog close/reopen)', async () => {
    mockFetch.mockClear()
    mockListen.mockClear()
    mockFetch.mockResolvedValue({secrets: {key: 'initial'}})

    // First subscriber stays mounted (like SecretsDemo)
    const {result: result1} = renderHook(() => useSecrets<Record<string, string>>('remount-ns'))

    await waitFor(() => {
      expect(result1.current.loading).toBe(false)
    })

    // Second subscriber mounts (like SettingsView opening)
    const hook2 = renderHook(() => useSecrets<Record<string, string>>('remount-ns'))

    await waitFor(() => {
      expect(hook2.result.current.loading).toBe(false)
    })

    // Second subscriber gets the replayed value, no new fetch
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(hook2.result.current.secrets).toEqual({key: 'initial'})

    // Unmount second subscriber (dialog closes)
    hook2.unmount()

    // Remount second subscriber (dialog reopens) — still no new fetch
    const hook3 = renderHook(() => useSecrets<Record<string, string>>('remount-ns'))

    await waitFor(() => {
      expect(hook3.result.current.loading).toBe(false)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(hook3.result.current.secrets).toEqual({key: 'initial'})
  })

  test('SSE events override fetch value (concat sequencing)', async () => {
    mockFetch.mockResolvedValue({secrets: {apiKey: 'from-fetch'}})

    const {result} = renderHook(() => useSecrets<Record<string, string>>('my-plugin'))

    // Fetch completes first via concat
    await waitFor(() => {
      expect(result.current.secrets).toEqual({apiKey: 'from-fetch'})
    })

    // SSE event arrives with newer data — overrides the fetch value
    act(() => {
      listenSubject.next({result: {secrets: {apiKey: 'from-sse'}}})
    })

    expect(result.current.secrets).toEqual({apiKey: 'from-sse'})
  })

  describe('storeSecrets', () => {
    test('stores secrets via transaction', async () => {
      mockFetch.mockResolvedValue(null)

      const {result} = renderHook(() => useSecrets<Record<string, string>>('my-plugin'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.storeSecrets({apiKey: 'new-secret'})
      })

      expect(mockClient.transaction).toHaveBeenCalled()
      expect(mockCreateIfNotExists).toHaveBeenCalledWith({
        _id: 'secrets.my-plugin',
        _type: 'pluginSecrets',
      })
      // Verify client.patch(id).set({secrets}) builds the keysPatch
      expect(mockPatch).toHaveBeenCalledWith('secrets.my-plugin')
      expect(mockSet).toHaveBeenCalledWith({secrets: {apiKey: 'new-secret'}})
      // Verify the keysPatch (return value of .set()) was passed into the transaction
      const keysPatch = mockSet.mock.results[0]?.value
      expect(mockTransactionPatch).toHaveBeenCalledWith(keysPatch)
    })

    test('resets loading to false when commit fails', async () => {
      mockCommit.mockRejectedValue(new Error('Network error'))
      mockFetch.mockResolvedValue(null)

      const {result} = renderHook(() => useSecrets<Record<string, string>>('my-plugin'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.storeSecrets({apiKey: 'will-fail'})
      })

      expect(result.current.loading).toBe(true)

      // Wait for the rejected commit to settle
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    test('sets loading to true while storing', async () => {
      // Make commit hang so we can observe loading state
      let resolveCommit: () => void
      mockCommit.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveCommit = resolve
        }),
      )
      mockFetch.mockResolvedValue(null)

      const {result} = renderHook(() => useSecrets<Record<string, string>>('my-plugin'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.storeSecrets({apiKey: 'test'})
      })

      expect(result.current.loading).toBe(true)

      // Resolve the commit
      await act(async () => {
        resolveCommit!()
      })

      expect(result.current.loading).toBe(false)
    })
  })
})
