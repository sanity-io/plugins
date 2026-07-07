import type {ConfigContext} from 'sanity'
import type {StructureBuilder} from 'sanity/structure'
import {describe, expect, it} from 'vitest'

import {orderableDocumentListDeskItem} from '../orderableDocumentListDeskItem'

/**
 * Regression test for https://github.com/sanity-io/plugins/issues/1506
 *
 * `orderableDocumentListDeskItem` must only claim create/edit intents for its
 * own document type. Before the fix in this commit, the `canHandleIntent`
 * callback was arity-0 and returned `true` for every intent, so any orderable
 * list would hijack the router for new-document creation of unrelated types.
 */

type IntentParams = {[key: string]: unknown}
type IntentCallback = (intentName: string, params: IntentParams) => boolean

/**
 * Build a minimal `StructureBuilder` stub that captures the callback passed
 * to `.canHandleIntent()` on the `documentTypeList`. We don't need a real
 * builder — we only care about the callback the plugin hands us.
 *
 * Every builder is a Proxy where any method call returns the same Proxy,
 * except `.serialize()` (returns a plain object snapshot) and
 * `.canHandleIntent()` on `documentTypeList` (captures the callback for
 * later inspection).
 */
function makeStub(): {
  S: StructureBuilder
  context: ConfigContext
  getCapturedCanHandleIntent: () => IntentCallback | undefined
} {
  let capturedCanHandleIntent: IntentCallback | undefined

  const makeChain = (onCanHandleIntent?: (cb: IntentCallback) => void) => {
    const state: Record<string, unknown> = {}
    const proxy: Record<string, unknown> = new Proxy(state, {
      get(target, prop) {
        if (prop === 'serialize') return () => ({...target})
        if (prop === 'canHandleIntent' && onCanHandleIntent) {
          return (cb: IntentCallback) => {
            onCanHandleIntent(cb)
            return proxy
          }
        }
        // Chainable setter: stash the value on the target and return proxy.
        return (value: unknown) => {
          // eslint-disable-next-line typescript/no-unsafe-type-assertion -- `prop` from Proxy get() is symbol | string; we only use string keys.
          target[prop as string] = value
          return proxy
        }
      },
    })
    return proxy
  }

  const stubS = {
    menuItem: () => makeChain(),
    listItem: () => makeChain(),
    documentTypeList: () =>
      makeChain((cb) => {
        capturedCanHandleIntent = cb
      }),
  }
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- test stub; we only implement the surface the plugin uses.
  const S = stubS as unknown as StructureBuilder

  const stubContext = {
    schema: {get: () => ({title: 'Category'})},
    getClient: () => ({}),
  }
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- test stub; we only implement the surface the plugin uses.
  const context = stubContext as unknown as ConfigContext

  return {
    S,
    context,
    getCapturedCanHandleIntent: () => capturedCanHandleIntent,
  }
}

describe('orderableDocumentListDeskItem — canHandleIntent (issue #1506)', () => {
  it('claims create/edit intents for its own document type', () => {
    const {S, context, getCapturedCanHandleIntent} = makeStub()

    orderableDocumentListDeskItem({type: 'orderableCategory', S, context})

    const canHandleIntent = getCapturedCanHandleIntent()
    expect(canHandleIntent).toBeDefined()

    expect(canHandleIntent!('create', {type: 'orderableCategory'})).toBe(true)
    expect(canHandleIntent!('edit', {type: 'orderableCategory'})).toBe(true)
  })

  it('does NOT claim create/edit intents for other document types', () => {
    const {S, context, getCapturedCanHandleIntent} = makeStub()

    orderableDocumentListDeskItem({type: 'orderableCategory', S, context})

    const canHandleIntent = getCapturedCanHandleIntent()
    expect(canHandleIntent).toBeDefined()

    // These are the intents the reporter saw being hijacked.
    expect(canHandleIntent!('create', {type: 'page'})).toBe(false)
    expect(canHandleIntent!('create', {type: 'author'})).toBe(false)
    expect(canHandleIntent!('edit', {type: 'someOtherType'})).toBe(false)
  })

  it('does not claim intents when createIntent is explicitly false, even for its own type', () => {
    const {S, context, getCapturedCanHandleIntent} = makeStub()

    orderableDocumentListDeskItem({
      type: 'orderableCategory',
      createIntent: false,
      S,
      context,
    })

    const canHandleIntent = getCapturedCanHandleIntent()
    expect(canHandleIntent).toBeDefined()
    expect(canHandleIntent!('create', {type: 'orderableCategory'})).toBe(false)
  })

  it('does not claim intents when params has no type key', () => {
    const {S, context, getCapturedCanHandleIntent} = makeStub()

    orderableDocumentListDeskItem({type: 'orderableCategory', S, context})

    const canHandleIntent = getCapturedCanHandleIntent()
    expect(canHandleIntent).toBeDefined()

    // Sanity's IntentChecker signature says params is always an object, but
    // it may not contain `type`. A type-less intent must not be claimed by
    // an orderable list bound to a specific type.
    expect(canHandleIntent!('create', {})).toBe(false)
    expect(canHandleIntent!('edit', {id: 'some-id'})).toBe(false)
  })
})
