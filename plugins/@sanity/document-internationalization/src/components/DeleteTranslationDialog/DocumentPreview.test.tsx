import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {ThemeWrapper} from '../../test/component-helpers'
import DocumentPreview from './DocumentPreview'

const mockGetSchemaType = vi.fn()

vi.mock('sanity', () => ({
  Preview: ({value}: {value: {_id?: string}}) => <div data-testid="preview">{value?._id}</div>,
  useSchema: () => ({get: mockGetSchemaType}),
}))

vi.mock('sanity-plugin-utils', () => ({
  Feedback: ({title}: {title: string}) => <div data-testid="feedback">{title}</div>,
}))

describe('DocumentPreview', () => {
  beforeEach(() => {
    mockGetSchemaType.mockReturnValue({name: 'article'})
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('renders Preview when schema type exists', () => {
    render(<DocumentPreview value={{_id: 'doc-1'}} type="article" />, {wrapper: ThemeWrapper})

    expect(screen.getByTestId('preview')).toHaveTextContent('doc-1')
    expect(mockGetSchemaType).toHaveBeenCalledWith('article')
  })

  test('renders feedback when schema type is missing', () => {
    mockGetSchemaType.mockReturnValue(undefined)

    render(<DocumentPreview value={{_id: 'doc-1'}} type="unknown" />, {wrapper: ThemeWrapper})

    expect(screen.getByTestId('feedback')).toHaveTextContent('Schema type not found')
  })
})
