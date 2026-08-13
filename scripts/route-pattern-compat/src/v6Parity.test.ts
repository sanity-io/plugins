import {match as matchV6} from 'path-to-regexp-v6'
import {match as matchV8} from 'path-to-regexp-v8'
import {describe, expect, test} from 'vitest'

import {V6_CORPUS, V8_CORPUS} from './corpus.ts'
import {createRouteMatcher, type RouteMatch} from './matchRoute.ts'

type Params = Record<string, string | string[]>

/** Normalizes a `path-to-regexp` result into the shape `createRouteMatcher` returns. */
function toRouteMatch(result: false | {path: string; params: Params}): RouteMatch | undefined {
  return result ? {path: result.path, params: result.params} : undefined
}

/** How Presentation calls path-to-regexp today, in `getRouteContext`. */
function withV6(pattern: string, pathname: string): RouteMatch | undefined {
  return toRouteMatch(matchV6<Params>(pattern, {decode: decodeURIComponent})(pathname))
}

function withV8(pattern: string, pathname: string): RouteMatch | undefined {
  return toRouteMatch(matchV8<Params>(pattern, {decode: decodeURIComponent})(pathname))
}

describe('every path-to-regexp v6 pattern in the corpus compiles under URLPattern', () => {
  for (const {pattern, description} of V6_CORPUS) {
    test(`${description}: ${pattern}`, () => {
      expect(() => matchV6(pattern)).not.toThrow()
      expect(() => createRouteMatcher(pattern)).not.toThrow()
    })
  }
})

describe('the URLPattern matcher agrees with path-to-regexp v6', () => {
  for (const {pattern, description, inputs} of V6_CORPUS) {
    const matcher = createRouteMatcher(pattern)
    for (const input of inputs) {
      test(`${description}: ${pattern} × ${input}`, () => {
        expect(matcher(input)).toEqual(withV6(pattern, input))
      })
    }
  }
})

describe('the URLPattern matcher agrees with path-to-regexp v8 on v8-era patterns', () => {
  for (const {pattern, description, inputs} of V8_CORPUS) {
    const matcher = createRouteMatcher(pattern)
    for (const input of inputs) {
      test(`${description}: ${pattern} × ${input}`, () => {
        expect(matcher(input)).toEqual(withV8(pattern, input))
      })
    }
  }
})

describe('path-to-regexp v8 is the regression this spike is about', () => {
  test('it rejects most of the v6 corpus outright', () => {
    const rejected = V6_CORPUS.filter(({pattern}) => {
      try {
        matchV8(pattern)
        return false
      } catch {
        return true
      }
    }).map(({pattern}) => pattern)

    expect(rejected).toMatchInlineSnapshot(`
      [
        "/:prefix(.*)/course/:slug",
        "/:locale(en|no|se)/blog/:slug",
        "/:id(\\d+)",
        "/(\\d+)",
        "/(.*)",
        "/(.*)/end",
        "/blog/:slug?",
        "/:locale?/product/:slug",
        "/:path*",
        "/blog/:slug+",
        "{/:parts}*",
        "/prefix{/:rest}*",
        "/:attr1?{-:attr2}?",
        "{-:attr}+",
        "/api/v:version(\\d+)/items",
        "/:slug([a-z0-9-]+)",
      ]
    `)
  })

  test('the reported pattern throws, which is what takes the Presentation tool down', () => {
    expect(() => matchV8('/:prefix(.*)/course/:slug')).toThrow(/Unexpected \(/)
  })
})
