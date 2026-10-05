import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {ThemeWrapper} from '../../test/component-helpers'
import EditButton from './EditButton'

const mockNavigateIntent = vi.fn()

vi.mock('sanity/router', () => ({
  useRouter: () => ({navigateIntent: mockNavigateIntent}),
}))

// Id from the reported structure URL:
// structure/blog;blog;drafts.98e46e37-6e3a-4327-8ac5-3daa23fbe791
const PUBLISHED_ID = '98e46e37-6e3a-4327-8ac5-3daa23fbe791'
const DRAFT_ID = `drafts.${PUBLISHED_ID}`

describe('EditButton', () => {
  beforeEach(() => {
    mockNavigateIntent.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  test('opens an unpublished draft with the published document id', () => {
    render(<EditButton id={DRAFT_ID} type="blog" />, {wrapper: ThemeWrapper})

    fireEvent.click(screen.getByRole('button', {name: 'Edit'}))

    expect(mockNavigateIntent).toHaveBeenCalledWith('edit', {id: PUBLISHED_ID, type: 'blog'})
  })

  test('opens a published document with its id', () => {
    render(<EditButton id={PUBLISHED_ID} type="blog" />, {wrapper: ThemeWrapper})

    fireEvent.click(screen.getByRole('button', {name: 'Edit'}))

    expect(mockNavigateIntent).toHaveBeenCalledWith('edit', {id: PUBLISHED_ID, type: 'blog'})
  })

  test('opens a content release version with the published document id', () => {
    render(<EditButton id={`versions.release.${PUBLISHED_ID}`} type="blog" />, {
      wrapper: ThemeWrapper,
    })

    fireEvent.click(screen.getByRole('button', {name: 'Edit'}))

    expect(mockNavigateIntent).toHaveBeenCalledWith('edit', {id: PUBLISHED_ID, type: 'blog'})
  })
})
