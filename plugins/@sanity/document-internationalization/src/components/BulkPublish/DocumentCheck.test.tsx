import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {ThemeWrapper} from '../../test/component-helpers'
import DocumentCheck from './DocumentCheck'

const mockUseEditState = vi.fn()
const mockUseValidationStatus = vi.fn()
const mockGetSchemaType = vi.fn()

vi.mock('sanity', () => ({
  Preview: ({value}: {value: {_id?: string}}) => <div data-testid="preview">{value?._id}</div>,
  useEditState: (...args: unknown[]) => mockUseEditState(...args),
  useValidationStatus: (...args: unknown[]) => mockUseValidationStatus(...args),
  useSchema: () => ({get: mockGetSchemaType}),
}))

function createCallbacks() {
  return {
    onCheckComplete: vi.fn(),
    addInvalidId: vi.fn(),
    removeInvalidId: vi.fn(),
    addDraftId: vi.fn(),
    removeDraftId: vi.fn(),
  }
}

describe('DocumentCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEditState.mockReturnValue({
      draft: {_id: 'drafts.doc-1', _type: 'article'},
      published: {_id: 'doc-1', _type: 'article'},
    })
    mockUseValidationStatus.mockReturnValue({
      isValidating: false,
      validation: [],
    })
    mockGetSchemaType.mockReturnValue({name: 'article'})
  })

  test('renders null and marks non-draft state when document has no draft', () => {
    mockUseEditState.mockReturnValue({
      draft: null,
      published: {_id: 'doc-1', _type: 'article'},
    })
    const callbacks = createCallbacks()

    const {container} = render(<DocumentCheck id="doc-1" {...callbacks} />, {wrapper: ThemeWrapper})

    expect(container.firstChild).toBeNull()
    expect(callbacks.removeDraftId).toHaveBeenCalledWith('doc-1')
    expect(callbacks.removeInvalidId).toHaveBeenCalledWith('doc-1')
    expect(callbacks.onCheckComplete).toHaveBeenCalledWith('doc-1')
  })

  test('renders preview and reports draft with no validation errors', () => {
    const callbacks = createCallbacks()

    render(<DocumentCheck id="doc-1" {...callbacks} />, {wrapper: ThemeWrapper})

    expect(screen.getByTestId('preview')).toHaveTextContent('drafts.doc-1')
    expect(callbacks.addDraftId).toHaveBeenCalledWith('doc-1')
    expect(callbacks.removeInvalidId).toHaveBeenCalledWith('doc-1')
    expect(callbacks.onCheckComplete).toHaveBeenCalledWith('doc-1')
  })

  test('marks document as invalid when validation has errors', () => {
    mockUseValidationStatus.mockReturnValue({
      isValidating: false,
      validation: [{level: 'error'}],
    })
    const callbacks = createCallbacks()

    render(<DocumentCheck id="doc-1" {...callbacks} />, {wrapper: ThemeWrapper})

    expect(callbacks.addInvalidId).toHaveBeenCalledWith('doc-1')
    expect(callbacks.addDraftId).toHaveBeenCalledWith('doc-1')
    expect(callbacks.onCheckComplete).toHaveBeenCalledWith('doc-1')
  })

  test('does not call onCheckComplete while validation is in progress', () => {
    mockUseValidationStatus.mockReturnValue({
      isValidating: true,
      validation: [],
    })
    const callbacks = createCallbacks()

    render(<DocumentCheck id="doc-1" {...callbacks} />, {wrapper: ThemeWrapper})

    expect(callbacks.onCheckComplete).not.toHaveBeenCalled()
    expect(callbacks.addDraftId).toHaveBeenCalledWith('doc-1')
  })

  test('renders spinner while schema type is unavailable', () => {
    mockGetSchemaType.mockReturnValue(undefined)
    const callbacks = createCallbacks()

    const {container} = render(<DocumentCheck id="doc-1" {...callbacks} />, {wrapper: ThemeWrapper})

    expect(container.querySelectorAll('[data-testid="preview"]')).toHaveLength(0)
    expect(container.querySelector('[data-ui="Spinner"]')).toBeInTheDocument()
  })
})
