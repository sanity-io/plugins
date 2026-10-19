import {RobotsRequestError} from '../actions/robots'
import type {RobotsAdvisory, RobotsCapability} from './types'

export const ROBOTS_PRICING_URL = 'https://www.mux.com/docs/pricing/overview#mux-robots-pricing'
export const ROBOTS_DIRECTIVES_DOCS_URL = 'https://www.mux.com/docs/guides/robots-directives'
export const ROBOTS_UPLOAD_DIRECTIVES_GUIDE_URL =
  'https://github.com/sanity-io/plugins/tree/main/plugins/sanity-plugin-mux-input#directives-on-upload'
export const ROBOTS_ACCESS_TOKENS_URL = 'https://dashboard.mux.com/settings/access-tokens'
/** No organization or environment in it, so it's right for every account. */
export const ROBOTS_DASHBOARD_URL = 'https://dashboard.mux.com'

/**
 * What an error says about whether this Studio can use Robots at all, or `undefined` for most
 * errors, including every refusal of a single run. Mux's answers are marked by the proxy, so its
 * own 401 (no secrets, no session) is never read as a missing scope.
 */
export function capabilityFromError(error: unknown): RobotsCapability | undefined {
  if (!(error instanceof RobotsRequestError)) return undefined
  const {status, type, muxAnswered} = error

  // The proxy answered 404 itself: it doesn't have the Robots routes yet.
  if (status === 404 && !muxAnswered) return {state: 'unavailable'}
  if (!muxAnswered) return undefined
  if (status === 401 || type === 'insufficient_scope') return {state: 'scope-missing'}
  if (status === 403 && (type === undefined || type === 'forbidden')) {
    const termsUrl = dashboardUrlIn(error.message)
    return termsUrl ? {state: 'not-enabled', termsUrl} : {state: 'not-enabled'}
  }
  return undefined
}

/** A limit a refused run ran into. A warning, never a capability: a cheaper run may still fit. */
export function advisoryFromError(error: unknown): RobotsAdvisory | undefined {
  return error instanceof RobotsRequestError && error.type === 'robots_units_limit_exceeded'
    ? 'units-exhausted'
    : undefined
}

/** The dashboard page Mux's terms message links, which names the exact environment. */
function dashboardUrlIn(message: string): string | undefined {
  return /https:\/\/dashboard\.mux\.com\/[^\s"'<>]*/.exec(message)?.[0].replace(/[.,;:)]+$/, '')
}

/** Shared by every document until new secrets are saved or someone checks again. */
let capabilityCache: RobotsCapability | undefined

export function cachedRobotsCapability(): RobotsCapability | undefined {
  return capabilityCache
}

export function recordRobotsCapability(capability: RobotsCapability): void {
  capabilityCache = capability
}

export function resetRobotsCapabilityCache(): void {
  capabilityCache = undefined
}
