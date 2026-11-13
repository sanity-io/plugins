import {v0_v2} from '@sanity/ui/theme'
import {describe, expect, it} from 'vitest'

import {buildTheme} from '../theme/buildTheme'
import type {BuildThemeOptions} from '../theme/options'
import {presets} from '../theme/presets'
import {type PreviewColors, previewColors} from './previewColors'

/** The preview colors, read from the Sanity UI theme the options build */
function themeColors(options: BuildThemeOptions, scheme: 'light' | 'dark'): PreviewColors {
  const color = v0_v2(buildTheme(options)).color[scheme].default
  const selected = color.selectable.default.selected
  const input = color.input.default.enabled

  // The colors the preview reuses for others must stay the same color
  expect(color.avatar.blue.bg).toBe(color.button.default.primary.enabled.bg)
  expect(selected.bg).toBe(color.button.default.primary.enabled.bg)
  expect(input.bg).toBe(color.bg)

  return {
    bg: color.bg,
    fg: color.fg,
    mutedFg: color.muted.fg,
    border: color.border,
    accent: color.button.default.primary.enabled.bg,
    inputBorder: input.border,
    selectedFg: selected.fg,
  }
}

const CASES: [string, BuildThemeOptions][] = [
  ['stock', {}],
  ...presets.map((preset): [string, BuildThemeOptions] => [preset.slug, preset.options]),
  [
    'custom',
    {
      light: {accent: '#f13009', text: '#678e9a', background: '#fcfdfd'},
      dark: {accent: '#f13009', text: '#678e9a', background: '#0e1315'},
    },
  ],
  ['low contrast', {light: {accent: '#15803d', contrast: 15}, dark: {contrast: 15}}],
  ['high contrast', {light: {contrast: 100}, dark: {accent: '#e11d48', contrast: 100}}],
  [
    'extreme backgrounds',
    {light: {background: '#333333'}, dark: {accent: '#111111', background: '#eeeeee'}},
  ],
]

describe('previewColors', () => {
  it.each(CASES)('matches the colors buildTheme gives the %s theme', (_name, options) => {
    const colors = previewColors(options)

    expect(colors.light).toEqual(themeColors(options, 'light'))
    expect(colors.dark).toEqual(themeColors(options, 'dark'))
  })
})
