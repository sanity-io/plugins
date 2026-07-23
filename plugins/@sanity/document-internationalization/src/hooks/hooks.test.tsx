import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {METADATA_SCHEMA_NAME} from '../constants'
import {useTranslationMetadata} from './useLanguageMetadata'
import {useOpenInNewPane} from './useOpenInNewPane'

const mockUseListeningQuery = vi.fn()
const mockNavigateIntent = vi.fn()
const mockNavigateUrl = vi.fn()
const mockResolvePathFromState = vi.fn(() => '/desk/article;doc-1')
const mockUsePaneRouter = vi.fn()

vi.mock('sanity-plugin-utils', () => ({
  useListeningQuery: (...args: unknown[]) => mockUseListeningQuery(...args),
}))

vi.mock('sanity/router', () => ({
  useRouter: () => ({
    navigateIntent: mockNavigateIntent,
    navigateUrl: mockNavigateUrl,
    resolvePathFromState: mockResolvePathFromState,
  }),
}))

vi.mock('sanity/structure', () => ({
  usePaneRouter: () => mockUsePaneRouter(),
}))

describe('useTranslationMetadata', () => {
  beforeEach(() => {
    mockUseListeningQuery.mockReturnValue({
      data: [{_id: 'meta-1', translations: []}],
      loading: false,
      error: null,
    })
  })

  test('queries metadata documents that reference the given id', () => {
    const {result} = renderHook(() => useTranslationMetadata('doc-1'))

    expect(mockUseListeningQuery).toHaveBeenCalledWith(
      expect.stringContaining('$id in translations[].value._ref'),
      {
        params: {id: 'doc-1', translationSchema: METADATA_SCHEMA_NAME},
      },
    )
    expect(result.current.data).toEqual([{_id: 'meta-1', translations: []}])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  test('forwards loading and error from useListeningQuery', () => {
    const error = new Error('query failed')
    mockUseListeningQuery.mockReturnValue({data: null, loading: true, error})

    const {result} = renderHook(() => useTranslationMetadata('doc-2'))

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(error)
  })
})

describe('useOpenInNewPane', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePaneRouter.mockReturnValue({
      routerPanesState: [],
      groupIndex: 0,
    })
  })

  test('does nothing when id is missing', () => {
    const {result} = renderHook(() => useOpenInNewPane(null, 'article'))
    result.current()

    expect(mockNavigateIntent).not.toHaveBeenCalled()
    expect(mockNavigateUrl).not.toHaveBeenCalled()
  })

  test('does nothing when type is missing', () => {
    const {result} = renderHook(() => useOpenInNewPane('doc-1', undefined))
    result.current()

    expect(mockNavigateIntent).not.toHaveBeenCalled()
    expect(mockNavigateUrl).not.toHaveBeenCalled()
  })

  test('navigates via intent when no panes are open', () => {
    mockUsePaneRouter.mockReturnValue({
      routerPanesState: [],
      groupIndex: 0,
    })

    const {result} = renderHook(() => useOpenInNewPane('doc-1', 'article'))
    result.current()

    expect(mockNavigateIntent).toHaveBeenCalledWith('edit', {id: 'doc-1', type: 'article'})
    expect(mockNavigateUrl).not.toHaveBeenCalled()
  })

  test('splices a new pane after the current group and navigates by URL', () => {
    mockUsePaneRouter.mockReturnValue({
      routerPanesState: [[{id: 'doc-0', params: {type: 'article'}}]],
      groupIndex: 0,
    })

    const {result} = renderHook(() => useOpenInNewPane('doc-1', 'article'))
    result.current()

    expect(mockResolvePathFromState).toHaveBeenCalledWith({
      panes: [
        [{id: 'doc-0', params: {type: 'article'}}],
        [{id: 'doc-1', params: {type: 'article'}}],
      ],
    })
    expect(mockNavigateUrl).toHaveBeenCalledWith({path: '/desk/article;doc-1'})
    expect(mockNavigateIntent).not.toHaveBeenCalled()
  })
})
