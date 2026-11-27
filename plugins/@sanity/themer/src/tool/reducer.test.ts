import {describe, expect, it} from 'vitest'

import {type ToolReducerState, toolReducer} from './reducer'

describe('toolReducer', () => {
  /** Where a tab starts: closed, nothing prerendered */
  const closed: ToolReducerState = {
    navbarHeight: null,
    open: false,
    prerender: false,
    prerenderSplitScreen: false,
    split: false,
  }

  it('prerenders what it opens', () => {
    const open = toolReducer(closed, {type: 'open'})
    expect(open).toMatchObject({open: true, prerender: true})

    const split = toolReducer(open, {type: 'split-screen:open'})
    expect(split).toMatchObject({split: true, prerenderSplitScreen: true})

    // What was prerendered stays mounted, ready for the next showing
    expect(toolReducer(split, {type: 'split-screen:close'})).toMatchObject({
      split: false,
      prerenderSplitScreen: true,
    })
    expect(toolReducer(open, {type: 'close'})).toMatchObject({open: false, prerender: true})
  })

  it('keeps the navbar height the toggle measures', () => {
    const measured = toolReducer(closed, {type: 'set-navbar-height', height: 49})
    expect(measured.navbarHeight).toBe(49)
    expect(toolReducer(measured, {type: 'set-navbar-height', height: 49})).toBe(measured)
  })

  it('throws on an action it does not know', () => {
    // oxlint-disable-next-line no-unsafe-type-assertion -- an action the types rule out, on purpose
    const unknown = {type: 'toggle'} as unknown as Parameters<typeof toolReducer>[1]

    expect(() => toolReducer(closed, unknown)).toThrow(
      'Unknown themer tool action: {"type":"toggle"}',
    )
  })

  it('returns the same state when nothing changes, so that nothing re-renders', () => {
    expect(toolReducer(closed, {type: 'close'})).toBe(closed)
    expect(toolReducer(closed, {type: 'split-screen:close'})).toBe(closed)
  })
})
