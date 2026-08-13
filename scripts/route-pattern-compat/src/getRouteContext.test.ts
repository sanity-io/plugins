import {describe, expect, test} from 'vitest'

import {getRouteContext} from './getRouteContext.ts'

describe('getRouteContext', () => {
  test('resolves a relative route against the preview URL', () => {
    expect(getRouteContext('/course/:slug', new URL('https://example.com/course/intro'))).toEqual({
      origin: 'https://example.com',
      params: {slug: 'intro'},
      path: '/course/intro',
    })
  })

  test('tries each route in order and returns the first that matches', () => {
    const routes = ['/course/:slug', '/*prefix/course/:slug']

    expect(getRouteContext(routes, new URL('https://example.com/course/intro'))).toEqual({
      origin: 'https://example.com',
      params: {slug: 'intro'},
      path: '/course/intro',
    })
    expect(getRouteContext(routes, new URL('https://example.com/no/course/intro'))).toEqual({
      origin: 'https://example.com',
      params: {prefix: ['no'], slug: 'intro'},
      path: '/no/course/intro',
    })
  })

  test('matches an absolute route only when the origins agree', () => {
    const route = 'https://example.com/course/:slug'

    expect(getRouteContext(route, new URL('https://example.com/course/intro'))).toEqual({
      origin: 'https://example.com',
      params: {slug: 'intro'},
      path: '/course/intro',
    })
    expect(getRouteContext(route, new URL('https://other.example/course/intro'))).toBeUndefined()
  })

  test('returns undefined when no route matches', () => {
    expect(getRouteContext('/course/:slug', new URL('https://example.com/about'))).toBeUndefined()
  })

  test('reports the offending pattern when it cannot be compiled', () => {
    expect(() => getRouteContext('/:id/:id', new URL('https://example.com/a/b'))).toThrow(
      '"/:id/:id" is not a valid route pattern',
    )
  })
})
