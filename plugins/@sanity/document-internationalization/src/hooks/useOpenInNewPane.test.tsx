import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {useOpenInNewPane} from './useOpenInNewPane'

const mockNavigateIntent = vi.fn()
const mockNavigateUrl = vi.fn()
const mockResolvePathFromState = vi.fn(() => '/desk/article;doc-1')
const mockUsePaneRouter = vi.fn()

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
