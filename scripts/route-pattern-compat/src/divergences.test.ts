/**
 * The differences that remain between the URLPattern matcher and path-to-regexp, asserted so they
 * are documented rather than discovered in production. Everything else is covered by
 * `v6Parity.test.ts`.
 */
import {match as matchV6} from 'path-to-regexp-v6'
import {match as matchV8} from 'path-to-regexp-v8'
import {describe, expect, test} from 'vitest'

import {createRouteMatcher} from './matchRoute.ts'
import {urlPatternImplementation} from './urlPattern.ts'

describe('percent-encoded literals: URLPattern is the more correct of the two', () => {
  // `getRouteContext` matches against `url.pathname`, which is always percent-encoded, so a route
  // pattern containing non-ASCII text could never match under path-to-regexp.
  const pattern = '/kurs/programmerings-oversikt-på-nett'
  const pathname = new URL(`https://example.com${pattern}`).pathname

  test('URLPattern canonicalizes the pattern and matches the real pathname', () => {
    expect(pathname).toBe('/kurs/programmerings-oversikt-p%C3%A5-nett')
    expect(createRouteMatcher(pattern)(pathname)).toEqual({path: pathname, params: {}})
  })

  test('path-to-regexp matches only the raw, un-encoded text', () => {
    expect(matchV6(pattern)(pathname)).toBe(false)
    expect(matchV8(pattern)(pathname)).toBe(false)
    expect(matchV6(pattern)(pattern)).toMatchObject({params: {}})
  })

  test('URLPattern canonicalizes the input too, so it matches either spelling', () => {
    expect(createRouteMatcher(pattern)(pattern)).toEqual({path: pattern, params: {}})
  })
})

describe('`{…}` groups mean different things in v6 and v8', () => {
  // v8 made a group without a modifier optional. URLPattern agrees with v6: it is required.
  const pattern = '/books{/:id}'

  test('URLPattern and v6 require the group', () => {
    expect(createRouteMatcher(pattern)('/books')).toBeUndefined()
    expect(matchV6(pattern)('/books')).toBe(false)
  })

  test('v8 treats it as optional', () => {
    expect(matchV8(pattern)('/books')).toMatchObject({params: {}})
  })

  test('so a studio that moved to v8 and wrote `{…}` expecting optional needs `{…}?`', () => {
    expect(createRouteMatcher('/books{/:id}?')('/books')).toEqual({path: '/books', params: {}})
    expect(createRouteMatcher('/books{/:id}?')('/books/1')).toEqual({
      path: '/books/1',
      params: {id: '1'},
    })
  })
})

describe('urlpattern-polyfill mishandles pathnames that begin with a double slash', () => {
  // `new URL('https://example.com//a').pathname` is `//a`, which the polyfill canonicalizes as if it
  // were protocol-relative. Native URLPattern and path-to-regexp agree with each other here.
  const matcher = createRouteMatcher('/(.*)')
  const pathname = new URL('https://example.com//course/intro').pathname

  test('the pathname really is double-slashed', () => {
    expect(pathname).toBe('//course/intro')
  })

  test(`the current implementation is ${urlPatternImplementation}`, () => {
    expect(matchV6('/(.*)')(pathname)).toMatchObject({params: {0: '/course/intro'}})

    if (urlPatternImplementation === 'polyfill') {
      // Known polyfill bug: `//course/intro` is read as authority `course` plus pathname `/intro`,
      // so the match succeeds against the wrong text instead of failing.
      expect(matcher(pathname)).toEqual({path: pathname, params: {0: 'intro'}})
    } else {
      expect(matcher(pathname)).toEqual({path: pathname, params: {0: '/course/intro'}})
    }
  })
})
