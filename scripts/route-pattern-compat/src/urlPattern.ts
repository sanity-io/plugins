/**
 * Mirrors what Presentation already does in `resolve-allow-patterns.ts`: use the native URLPattern
 * when the runtime has one, and lazily load the polyfill when it does not. Native URLPattern shipped
 * in Node 24, Chrome 95, Firefox 142 and Safari 26.
 */
const native = typeof URLPattern !== 'undefined'

if (!native) {
  await import('urlpattern-polyfill')
}

/** Which implementation the current process is exercising. The two do not agree on every input. */
export const urlPatternImplementation: 'native' | 'polyfill' = native ? 'native' : 'polyfill'
