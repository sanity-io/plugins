/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import {cleanup, render} from '@testing-library/react'
import {PatchEvent} from 'sanity'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {ThemeWrapper} from '../../test/component-helpers'
import {createMockTranslation} from '../../test/helpers'
import OptimisticallyStrengthen from './index'
import ReferencePatcher from './ReferencePatcher'

const mockUseEditState = vi.fn()
const mockOnChange = vi.fn()
const mockUseClient = vi.fn(() => ({}))

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    useEditState: (id: string, type: string) => mockUseEditState(id, type),
    useClient: () => mockUseClient(),
  }
})

vi.mock('sanity/structure', () => ({
  useDocumentPane: () => ({onChange: mockOnChange}),
}))

describe('OptimisticallyStrengthen', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('returns null when translations are empty', () => {
    const {container} = render(<OptimisticallyStrengthen translations={[]} metadataId="meta-1" />, {
      wrapper: ThemeWrapper,
    })

    expect(container.firstChild).toBeNull()
  })

  test('renders ReferencePatcher only for items with _strengthenOnPublish.type', () => {
    mockUseEditState.mockReturnValue({
      draft: {_id: 'drafts.doc-1'},
      published: null,
      ready: true,
    })

    const withStrengthen = createMockTranslation('en', 'doc-1', {
      weak: true,
      strengthenOnPublish: true,
      type: 'article',
    })
    const withoutStrengthen = createMockTranslation('fr', 'doc-2', {
      weak: true,
      strengthenOnPublish: false,
    })

    render(
      <OptimisticallyStrengthen
        translations={[withStrengthen, withoutStrengthen]}
        metadataId="meta-1"
      />,
      {wrapper: ThemeWrapper},
    )

    expect(mockUseEditState).toHaveBeenCalledTimes(1)
    expect(mockUseEditState).toHaveBeenCalledWith('doc-1', 'article')
  })
})

describe('ReferencePatcher', () => {
  beforeEach(() => {
    mockOnChange.mockClear()
    mockUseEditState.mockReturnValue({
      draft: null,
      published: {_id: 'doc-1', _type: 'article'},
      ready: true,
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('patches to unset _weak and _strengthenOnPublish when published and ready', () => {
    const translation = createMockTranslation('en', 'doc-1', {
      weak: true,
      strengthenOnPublish: true,
      type: 'article',
    })

    render(
      <ReferencePatcher translation={translation} documentType="article" metadataId="meta-1" />,
    )

    expect(mockOnChange).toHaveBeenCalledTimes(1)
    const patchEvent = mockOnChange.mock.calls[0]![0] as PatchEvent
    expect(patchEvent).toBeInstanceOf(PatchEvent)
    expect(JSON.stringify(patchEvent)).toContain('_weak')
    expect(JSON.stringify(patchEvent)).toContain('_strengthenOnPublish')
  })

  test('does not patch when a draft still exists', () => {
    mockUseEditState.mockReturnValue({
      draft: {_id: 'drafts.doc-1'},
      published: {_id: 'doc-1'},
      ready: true,
    })
    const translation = createMockTranslation('en', 'doc-1', {
      weak: true,
      strengthenOnPublish: true,
    })

    render(
      <ReferencePatcher translation={translation} documentType="article" metadataId="meta-1" />,
    )

    expect(mockOnChange).not.toHaveBeenCalled()
  })

  test('does not patch when edit state is not ready', () => {
    mockUseEditState.mockReturnValue({
      draft: null,
      published: {_id: 'doc-1'},
      ready: false,
    })
    const translation = createMockTranslation('en', 'doc-1', {
      weak: true,
      strengthenOnPublish: true,
    })

    render(
      <ReferencePatcher translation={translation} documentType="article" metadataId="meta-1" />,
    )

    expect(mockOnChange).not.toHaveBeenCalled()
  })

  test('does not patch when reference is already strong', () => {
    const translation = createMockTranslation('en', 'doc-1', {
      weak: false,
      strengthenOnPublish: true,
    })

    render(
      <ReferencePatcher translation={translation} documentType="article" metadataId="meta-1" />,
    )

    expect(mockOnChange).not.toHaveBeenCalled()
  })

  test('does not patch when _strengthenOnPublish is missing', () => {
    const translation = createMockTranslation('en', 'doc-1', {
      weak: true,
      strengthenOnPublish: false,
    })

    render(
      <ReferencePatcher translation={translation} documentType="article" metadataId="meta-1" />,
    )

    expect(mockOnChange).not.toHaveBeenCalled()
  })
})
