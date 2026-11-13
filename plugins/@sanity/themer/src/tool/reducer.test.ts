import {describe, expect, it} from 'vitest'

import {type ToolReducerState, toolReducer} from './reducer'
import type {CustomTheme} from './themes'

const custom: CustomTheme = {slug: 'custom-1', title: 'Mine', options: {light: {accent: '#ff0000'}}}

describe('toolReducer', () => {
  /** Where a tab starts: closed, nothing prerendered, no theme applied */
  const closed: ToolReducerState = {
    navbarHeight: null,
    open: false,
    prerender: false,
    prerenderSplitScreen: false,
    split: false,
    theme: null,
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

  it('applies the published theme, and the configured theme as nothing', () => {
    const themed = toolReducer(closed, {type: 'set-theme', theme: custom.options})
    expect(themed.theme).toBe(custom.options)

    expect(toolReducer(themed, {type: 'unset-theme'}).theme).toBeNull()
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
    expect(toolReducer(closed, {type: 'unset-theme'})).toBe(closed)

    // The machine publishes the options anew each time; equal ones are the same theme
    const themed = toolReducer(closed, {type: 'set-theme', theme: custom.options})
    expect(toolReducer(themed, {type: 'set-theme', theme: {light: {accent: '#ff0000'}}})).toBe(
      themed,
    )
  })
})
