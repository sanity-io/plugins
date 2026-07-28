import {afterEach, describe, expect, test} from 'vitest'

import {
  clear,
  createCacheKey,
  createOrGetPromise,
  getFunctionCache,
  peek,
  preloadWithKey,
  setFunctionCache,
} from './cache'
import {MOCK_LANGUAGES} from './test/helpers'
import type {LanguageCallback} from './types'

afterEach(() => {
  clear()
})

describe('cache', () => {
  test('createCacheKey includes selected value and optional workspace id', () => {
    expect(createCacheKey({market: 'eu'})).toEqual([
      'v1',
      'sanity-plugin-internationalized-array',
      JSON.stringify({market: 'eu'}),
    ])
    expect(createCacheKey({}, 'chromium')).toEqual([
      'v1',
      'sanity-plugin-internationalized-array',
      JSON.stringify({}),
      'chromium',
    ])
  })

  test('createOrGetPromise caches by key and reuses the same promise', async () => {
    let calls = 0
    const fn = async () => {
      calls += 1
      return MOCK_LANGUAGES
    }
    const key = createCacheKey({})

    const first = createOrGetPromise(fn, key)
    const second = createOrGetPromise(fn, key)
    expect(first).toBe(second)

    await expect(first).resolves.toEqual(MOCK_LANGUAGES)
    expect(calls).toBe(1)
  })

  test('preloadWithKey warms the promise cache', async () => {
    const key = createCacheKey({})
    preloadWithKey(async () => MOCK_LANGUAGES.slice(0, 1), key)

    const result = await createOrGetPromise(async () => {
      throw new Error('should not run — cache already warm')
    }, key)

    expect(result).toEqual([{id: 'en', title: 'English'}])
  })

  test('clear empties the promise cache so subsequent fetches re-run', async () => {
    const key = createCacheKey({})
    let calls = 0
    const fn = async () => {
      calls += 1
      return MOCK_LANGUAGES
    }

    await createOrGetPromise(fn, key)
    clear()
    await createOrGetPromise(fn, key)
    expect(calls).toBe(2)
  })

  test('peek returns undefined for unresolved or missing entries', () => {
    expect(peek({})).toBeUndefined()
  })

  test('function cache stores and retrieves languages by callback identity', () => {
    const languagesFn: LanguageCallback = async () => MOCK_LANGUAGES
    const selected = {market: 'us'}

    expect(getFunctionCache(languagesFn, selected)).toBeUndefined()

    setFunctionCache(languagesFn, selected, MOCK_LANGUAGES, 'ws-1')
    expect(getFunctionCache(languagesFn, selected, 'ws-1')).toEqual(MOCK_LANGUAGES)
    expect(getFunctionCache(languagesFn, selected)).toBeUndefined()
  })
})
