import {describe, expect, it} from 'vitest'

import {initialToolState, toolReducer} from './reducer'
import {type CustomTheme, initialThemerState, type ThemerState} from './themes'

const custom: CustomTheme = {slug: 'custom-1', title: 'Mine', options: {light: {accent: '#ff0000'}}}

describe('initialToolState', () => {
  it('starts closed, with nothing prerendered and the stored theme applied', () => {
    const stored: ThemerState = {active: 'custom-1', custom: [custom], removed: [], order: []}

    expect(initialToolState(stored)).toEqual({
      prerender: false,
      prerenderSplitScreen: false,
      open: false,
      split: false,
      theme: custom.options,
    })
  })

  it('applies nothing for the configured theme, or for a stored theme that is gone', () => {
    expect(initialToolState(initialThemerState).theme).toBeNull()
    expect(
      initialToolState({active: 'custom-1', custom: [], removed: [], order: []}).theme,
    ).toBeNull()
    expect(
      initialToolState({active: 'custom-1', custom: [custom], removed: ['custom-1'], order: []})
        .theme,
    ).toBeNull()
  })
})

describe('toolReducer', () => {
  const closed = initialToolState(initialThemerState)

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
