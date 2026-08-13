import {createRouteMatcher, type RouteMatcher} from './matchRoute.ts'

/**
 * Mirrors `DocumentResolverContext` in `sanity/src/presentation/types.ts`. Presentation declares
 * `params` as `Record<string, string>`, which was never true for repeated params in either
 * path-to-regexp v6 or v8 — both hand back an array of segments there.
 */
export interface RouteContext {
  origin: string
  params: Record<string, string | string[]>
  path: string
}

/**
 * Compiling a URLPattern is not free and Presentation resolves the route again on every preview URL
 * change, so keep the compiled matchers around. Patterns come from studio config, so the set is
 * small and fixed.
 */
const matchers = new Map<string, RouteMatcher>()

function getMatcher(pattern: string): RouteMatcher {
  const cached = matchers.get(pattern)
  if (cached) return cached
  const matcher = createRouteMatcher(pattern)
  matchers.set(pattern, matcher)
  return matcher
}

/**
 * A drop-in replacement for `getRouteContext` in `sanity/src/presentation/useMainDocument.ts`,
 * backed by URLPattern instead of path-to-regexp.
 */
export function getRouteContext(route: string | string[], url: URL): RouteContext | undefined {
  const routes = Array.isArray(route) ? route : [route]

  // `let` as the path is replaced with the pathname for absolute URLs
  for (let path of routes) {
    let {origin} = url

    // Handle absolute URLs
    try {
      const absolute = new URL(path)

      // If we are dealing with an absolute URL, ensure the origins match
      if (absolute.origin !== origin) continue

      origin = absolute.origin
      path = absolute.pathname
    } catch {
      // Ignore, as we assume a relative path
    }

    let result
    try {
      result = getMatcher(path)(url.pathname)
    } catch (e) {
      throw new Error(`"${path}" is not a valid route pattern`, {cause: e})
    }
    if (result) {
      return {origin, params: result.params, path: result.path}
    }
  }
  return undefined
}
