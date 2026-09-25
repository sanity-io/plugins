/* oxlint-disable typescript-eslint/no-unsafe-type-assertion */
import {cleanup, render} from '@testing-library/react'
import {PatchEvent} from 'sanity'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {ThemeWrapper} from '../../test/component-helpers'
import {createMockTranslation} from '../../test/helpers'
import OptimisticallyStrengthen from './index'
import ReferencePatcher from './ReferencePatcher'

const mockUseUnstableObserveDocument = vi.fn()
const mockOnChange = vi.fn()
const mockUseDocumentPane = vi.fn()

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    useUnstableObserveDocument: (id: string) => mockUseUnstableObserveDocument(id),
  }
})

vi.mock('sanity/structure', () => ({
  useDocumentPane: () => mockUseDocumentPane(),
}))

const publishedDocument = {_id: 'doc-1', _type: 'article'}

function mockObserve(overrides?: {document?: unknown; loading?: boolean}) {
  mockUseUnstableObserveDocument.mockReturnValue({
    document: 'document' in (overrides ?? {}) ? overrides?.document : publishedDocument,
    loading: overrides?.loading ?? false,
  })
}

function mockPane(overrides?: {ready?: boolean; readOnly?: boolean}) {
  mockUseDocumentPane.mockReturnValue({
    onChange: mockOnChange,
    ready: overrides?.ready ?? true,
    formState: {readOnly: overrides?.readOnly ?? false},
  })
}

describe('OptimisticallyStrengthen', () => {
  beforeEach(() => {
    mockObserve()
    mockPane()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('returns null when translations are empty', () => {
    const {container} = render(<OptimisticallyStrengthen translations={[]} />, {
      wrapper: ThemeWrapper,
    })

    expect(container.firstChild).toBeNull()
  })

  test('renders ReferencePatcher only for items with _strengthenOnPublish.type', () => {
    const withStrengthen = createMockTranslation('en', 'doc-1', {
      weak: true,
      strengthenOnPublish: true,
      type: 'article',
    })
    const withoutStrengthen = createMockTranslation('fr', 'doc-2', {
      weak: true,
      strengthenOnPublish: false,
    })

    render(<OptimisticallyStrengthen translations={[withStrengthen, withoutStrengthen]} />, {
      wrapper: ThemeWrapper,
    })

    expect(mockUseUnstableObserveDocument).toHaveBeenCalledTimes(1)
    expect(mockUseUnstableObserveDocument).toHaveBeenCalledWith('doc-1')
  })
})

describe('ReferencePatcher', () => {
  beforeEach(() => {
    mockOnChange.mockClear()
    mockObserve()
    mockPane()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('patches to unset _weak and _strengthenOnPublish when published and pane is ready', () => {
    const translation = createMockTranslation('en', 'doc-1', {
      weak: true,
      strengthenOnPublish: true,
      type: 'article',
    })

    render(<ReferencePatcher translation={translation} />)

    expect(mockOnChange).toHaveBeenCalledTimes(1)
    const patchEvent = mockOnChange.mock.calls[0]![0] as PatchEvent
    expect(patchEvent).toBeInstanceOf(PatchEvent)
    expect(JSON.stringify(patchEvent)).toContain('_weak')
    expect(JSON.stringify(patchEvent)).toContain('_strengthenOnPublish')
  })

  test('does not patch when the metadata pane is not ready', () => {
    mockPane({ready: false})
    const translation = createMockTranslation('en', 'doc-1', {
      weak: true,
      strengthenOnPublish: true,
    })

    render(<ReferencePatcher translation={translation} />)

    expect(mockOnChange).not.toHaveBeenCalled()
  })

  test('does not patch when the metadata pane is read-only', () => {
    mockPane({readOnly: true})
    const translation = createMockTranslation('en', 'doc-1', {
      weak: true,
      strengthenOnPublish: true,
    })

    render(<ReferencePatcher translation={translation} />)

    expect(mockOnChange).not.toHaveBeenCalled()
  })

  test('does not patch while the published document is still loading', () => {
    mockObserve({loading: true})
    const translation = createMockTranslation('en', 'doc-1', {
      weak: true,
      strengthenOnPublish: true,
    })

    render(<ReferencePatcher translation={translation} />)

    expect(mockOnChange).not.toHaveBeenCalled()
  })

  test('does not patch when no published document exists', () => {
    mockObserve({document: null})
    const translation = createMockTranslation('en', 'doc-1', {
      weak: true,
      strengthenOnPublish: true,
    })

    render(<ReferencePatcher translation={translation} />)

    expect(mockOnChange).not.toHaveBeenCalled()
  })

  test('does not patch when reference is already strong', () => {
    const translation = createMockTranslation('en', 'doc-1', {
      weak: false,
      strengthenOnPublish: true,
    })

    render(<ReferencePatcher translation={translation} />)

    expect(mockOnChange).not.toHaveBeenCalled()
  })

  test('does not patch when _strengthenOnPublish is missing', () => {
    const translation = createMockTranslation('en', 'doc-1', {
      weak: true,
      strengthenOnPublish: false,
    })

    render(<ReferencePatcher translation={translation} />)

    expect(mockOnChange).not.toHaveBeenCalled()
  })
})
