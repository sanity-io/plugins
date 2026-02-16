import {act, renderHook, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {useSecrets} from './useSecrets'

// --- Mocks ---

const mockFetch = vi.fn()
const mockListen = vi.fn()
const mockSet = vi.fn()
const mockPatch = vi.fn()
const mockCreateIfNotExists = vi.fn()
const mockCommit = vi.fn()

// Track subscription callbacks so tests can simulate SSE events
let listenCallback: ((result: Record<string, unknown>) => void) | undefined
let listenSubscription: {unsubscribe: ReturnType<typeof vi.fn>}

const mockClient = {
  fetch: mockFetch,
  observable: {
    listen: mockListen,
  },
  patch: mockPatch,
  transaction: vi.fn(),
}

vi.mock('sanity', () => ({
  useClient: () => mockClient,
}))

beforeEach(() => {
  listenSubscription = {unsubscribe: vi.fn()}

  mockListen.mockImplementation((_query: string, _params: unknown, _opts: unknown) => ({
    subscribe: (cb: (result: Record<string, unknown>) => void) => {
      listenCallback = cb
      return listenSubscription
    },
  }))

  mockFetch.mockResolvedValue(null)

  mockSet.mockReturnValue({toJSON: () => ({})})
  mockPatch.mockReturnValue({set: mockSet})
  mockCreateIfNotExists.mockReturnValue({patch: vi.fn().mockReturnValue({commit: mockCommit})})
  mockClient.transaction.mockReturnValue({createIfNotExists: mockCreateIfNotExists})
  mockCommit.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  listenCallback = undefined
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
      listenCallback?.({result: {secrets: {apiKey: 'new-value'}}})
    })

    expect(result.current.secrets).toEqual({apiKey: 'new-value'})
  })

  test('unsubscribes from listener on unmount', () => {
    const {unmount} = renderHook(() => useSecrets('my-plugin'))

    unmount()

    expect(listenSubscription.unsubscribe).toHaveBeenCalled()
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
      expect(mockPatch).toHaveBeenCalledWith('secrets.my-plugin')
      expect(mockSet).toHaveBeenCalledWith({secrets: {apiKey: 'new-secret'}})
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
