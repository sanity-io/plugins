import {cleanup, render} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {clear, createCacheKey, createOrGetPromise, peek} from '../cache'
import {MOCK_LANGUAGES} from '../test/helpers'
import Preload from './Preload'

const mockClient = {fetch: vi.fn()}

vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sanity')>()
  return {
    ...actual,
    useClient: vi.fn(() => mockClient),
  }
})

afterEach(() => {
  cleanup()
  clear()
})

describe('Preload', () => {
  beforeEach(() => {
    clear()
  })

  test('warms the promise cache for async languages', async () => {
    const languages = vi.fn(async () => MOCK_LANGUAGES)

    render(<Preload apiVersion="2025-10-15" languages={languages} />)

    const key = createCacheKey({})
    const result = await createOrGetPromise(async () => {
      throw new Error('should reuse the preloaded promise')
    }, key)

    expect(result).toEqual(MOCK_LANGUAGES)
    expect(languages).toHaveBeenCalledWith(mockClient, {})
  })

  test('does not start a second preload when cache is already warm', async () => {
    const first = vi.fn(async () => MOCK_LANGUAGES.slice(0, 1))
    const second = vi.fn(async () => MOCK_LANGUAGES)

    render(<Preload apiVersion="2025-10-15" languages={first} />)
    await createOrGetPromise(async () => MOCK_LANGUAGES.slice(0, 1), createCacheKey({}))

    render(<Preload apiVersion="2025-10-15" languages={second} />)

    expect(second).not.toHaveBeenCalled()
    // peek returns undefined until React's promise status fields are set
    expect(peek({}) === undefined || Array.isArray(peek({}))).toBe(true)
  })
})
