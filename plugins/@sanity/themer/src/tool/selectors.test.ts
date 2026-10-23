import {describe, expect, it} from 'vitest'

import {presets} from '../theme/presets'
import {resolveActiveThemeOptions} from './selectors'
import {type CustomTheme, initialThemerState, type ThemerState} from './themes'

const custom: CustomTheme = {slug: 'custom-1', title: 'Mine', options: {light: {accent: '#ff0000'}}}
const verdant = presets.find((preset) => preset.slug === 'verdant')!

describe('resolveActiveThemeOptions', () => {
  it('resolves the options of the applied theme, custom or preset', () => {
    const state: ThemerState = {active: 'custom-1', custom: [custom], removed: [], order: []}

    expect(resolveActiveThemeOptions(state)).toBe(custom.options)
    expect(resolveActiveThemeOptions({...state, active: 'verdant'})).toBe(verdant.options)
  })

  it('applies nothing for the configured theme, or for an applied theme that is gone', () => {
    expect(resolveActiveThemeOptions(initialThemerState)).toBeNull()
    expect(
      resolveActiveThemeOptions({active: 'custom-1', custom: [], removed: [], order: []}),
    ).toBeNull()
    expect(
      resolveActiveThemeOptions({
        active: 'custom-1',
        custom: [custom],
        removed: ['custom-1'],
        order: [],
      }),
    ).toBeNull()
  })
})
