// @vitest-environment jsdom
import type {SanityClient} from '@sanity/client'
import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {useGenerateCaption, useGenerateImage} from './useApiClient'

const mockToastPush = vi.fn()

vi.mock('@sanity/ui/toast', async (importOriginal) => {
  const original = await importOriginal<typeof import('@sanity/ui/toast')>()
  return {
    ...original,
    useToast: () => ({push: mockToastPush}),
  }
})

vi.mock('sanity', async (importOriginal) => {
  const original = await importOriginal<typeof import('sanity')>()
  return {
    ...original,
    useCurrentUser: () => ({id: 'user-1'}),
  }
})

vi.mock('./assistLayout/AiAssistanceConfigContext', () => ({
  useSerializedTypes: () => [],
}))

function mockApiClient() {
  const request = vi.fn(() => Promise.resolve())
  // oxlint-disable-next-line no-unsafe-type-assertion
  const apiClient = {
    request,
    config: () => ({dataset: 'plugins', projectId: 'ppsg7ml5'}),
  } as unknown as SanityClient
  return {apiClient, request}
}

describe('useGenerateCaption', () => {
  beforeEach(() => {
    mockToastPush.mockClear()
  })

  test('does not enter loading when documentId is missing', () => {
    const {apiClient, request} = mockApiClient()
    const {result} = renderHook(() => useGenerateCaption(apiClient))

    act(() => {
      void result.current.generateCaption({path: 'image.alt', documentId: undefined})
    })

    expect(result.current.loading).toBe(false)
    expect(request).not.toHaveBeenCalled()
    expect(mockToastPush).toHaveBeenCalledExactlyOnceWith({
      status: 'error',
      title: 'Document ID is required',
    })
  })

  test('sets loading when documentId is present', () => {
    const {apiClient, request} = mockApiClient()
    request.mockReturnValue(new Promise(() => {}))
    const {result} = renderHook(() => useGenerateCaption(apiClient))

    act(() => {
      void result.current.generateCaption({path: 'image.alt', documentId: 'drafts.article-1'})
    })

    expect(result.current.loading).toBe(true)
    expect(request).toHaveBeenCalledTimes(1)
  })
})

describe('useGenerateImage', () => {
  beforeEach(() => {
    mockToastPush.mockClear()
  })

  test('does not enter loading when documentId is missing', () => {
    const {apiClient, request} = mockApiClient()
    const {result} = renderHook(() => useGenerateImage(apiClient))

    act(() => {
      void result.current.generateImage({path: 'image', documentId: undefined})
    })

    expect(result.current.loading).toBe(false)
    expect(request).not.toHaveBeenCalled()
    expect(mockToastPush).toHaveBeenCalledExactlyOnceWith({
      status: 'error',
      title: 'Document ID is required',
    })
  })
})
