import {describe, expect, test} from 'vitest'

import {isolatePathParams} from './isolatePathParams'

describe('isolatePathParams', () => {
  test('keeps path local and does not forward when only path changed', () => {
    const hostParams = {inspect: 'sanity-assist', pathKey: 'title', path: 'title'}
    // The nested form spreads the current (isolated) params, then overrides path
    const nextParams = {...hostParams, path: 'fields[_key=="title"].instructions'}

    const {nextLocalPath, forwardParams} = isolatePathParams(nextParams, hostParams)

    expect(nextLocalPath).toBe('fields[_key=="title"].instructions')
    expect(forwardParams).toBeNull()
  })

  test('forwards non-path param changes while preserving the host path', () => {
    const hostParams = {inspect: 'sanity-assist', pathKey: 'title', path: 'title'}
    const nextParams = {...hostParams, instruction: 'abc123', path: 'fields[_key=="title"]'}

    const {nextLocalPath, forwardParams} = isolatePathParams(nextParams, hostParams)

    expect(nextLocalPath).toBe('fields[_key=="title"]')
    expect(forwardParams).toEqual({
      inspect: 'sanity-assist',
      pathKey: 'title',
      instruction: 'abc123',
      path: 'title',
    })
  })

  test('preserves an undefined host path when forwarding', () => {
    const hostParams = {inspect: 'sanity-assist', pathKey: 'title'}
    const nextParams = {...hostParams, instruction: 'abc123', path: 'fields[_key=="title"]'}

    const {nextLocalPath, forwardParams} = isolatePathParams(nextParams, hostParams)

    expect(nextLocalPath).toBe('fields[_key=="title"]')
    expect(forwardParams).toEqual({
      inspect: 'sanity-assist',
      pathKey: 'title',
      instruction: 'abc123',
      path: undefined,
    })
  })

  test('forwards cleared params (e.g. closing the inspector) without touching host path', () => {
    const hostParams = {
      inspect: 'sanity-assist',
      pathKey: 'title',
      instruction: 'abc',
      path: 'title',
    }
    const nextParams = {...hostParams, instruction: undefined, path: 'title'}

    const {nextLocalPath, forwardParams} = isolatePathParams(nextParams, hostParams)

    expect(nextLocalPath).toBe('title')
    expect(forwardParams).toEqual({
      inspect: 'sanity-assist',
      pathKey: 'title',
      instruction: undefined,
      path: 'title',
    })
  })

  test('treats missing path the same as undefined path (no false forwards)', () => {
    const hostParams = {pathKey: 'title'}
    const nextParams = {pathKey: 'title', path: 'fields[_key=="title"]'}

    const {nextLocalPath, forwardParams} = isolatePathParams(nextParams, hostParams)

    expect(nextLocalPath).toBe('fields[_key=="title"]')
    expect(forwardParams).toBeNull()
  })
})
