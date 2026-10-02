import {describe, expect, it} from 'vitest'

import {presets} from '../theme/presets'
import {
  CONFIG_SLUG,
  createCustomTheme,
  type CustomTheme,
  displayTitle,
  duplicateTitle,
  resolveThemes,
  type ThemerState,
} from './themes'

const custom: CustomTheme = {slug: 'custom-1', title: 'Mine', options: {light: {accent: '#ff0000'}}}
const stateWithCustom: ThemerState = {active: null, custom: [custom], removed: [], order: []}

describe('resolveThemes', () => {
  it('lists the presets and the custom themes in that order, without the configured theme', () => {
    const {themes, removed, active} = resolveThemes(stateWithCustom)

    expect(themes.map((theme) => theme.slug)).toEqual([
      ...presets.map((preset) => preset.slug),
      'custom-1',
    ])
    expect(themes[0].source).toBe('preset')
    expect(themes.at(-1)).toMatchObject({...custom, source: 'custom'})
    expect(themes.some((theme) => theme.slug === CONFIG_SLUG)).toBe(false)
    expect(removed).toEqual([])
    // The configured theme applies, which is not in the list
    expect(active).toBeUndefined()
  })

  it('keeps the options identity of every theme', () => {
    const {themes} = resolveThemes(stateWithCustom)

    expect(themes[0].options).toBe(presets[0].options)
    expect(themes.find((theme) => theme.slug === 'dew')?.options).toBe(
      presets.find((preset) => preset.slug === 'dew')?.options,
    )
    expect(themes.at(-1)?.options).toBe(custom.options)
  })

  it('sets removed themes aside, and applies the configured theme when the applied one goes', () => {
    const state: ThemerState = {
      active: 'verdant',
      custom: [custom],
      removed: ['verdant', 'custom-1'],
      order: [],
    }
    const {themes, removed, active} = resolveThemes(state)

    expect(themes.some((theme) => theme.slug === 'verdant')).toBe(false)
    expect(removed.map((theme) => theme.slug)).toEqual(['verdant', 'custom-1'])
    expect(active).toBeUndefined()
  })

  it('arranges the themes in the stored order, the rest after them in default order', () => {
    const {themes} = resolveThemes({
      ...stateWithCustom,
      order: ['custom-1', 'dew', 'unknown', CONFIG_SLUG],
    })
    const slugs = themes.map((theme) => theme.slug)
    const rest = presets.map((preset) => preset.slug).filter((slug) => slug !== 'dew')

    expect(slugs).toEqual(['custom-1', 'dew', ...rest])
  })

  it('keeps a removed theme in line for when it is restored', () => {
    const state: ThemerState = {
      ...stateWithCustom,
      removed: ['dew'],
      order: ['dew', 'custom-1'],
    }
    const {themes, removed} = resolveThemes(state)

    expect(themes.slice(0, 2).map((theme) => theme.slug)).toEqual(['custom-1', presets[0].slug])
    expect(removed.map((theme) => theme.slug)).toEqual(['dew'])
    expect(
      resolveThemes({...state, removed: []})
        .themes.slice(0, 3)
        .map((theme) => theme.slug),
    ).toEqual(['dew', 'custom-1', presets[0].slug])
  })

  it('applies the picked theme, or none when its slug no longer resolves', () => {
    const {active} = resolveThemes({...stateWithCustom, active: 'custom-1'})

    expect(active).toMatchObject({...custom, source: 'custom'})
    expect(resolveThemes({...stateWithCustom, active: 'unknown'}).active).toBeUndefined()
  })
})

describe('theme helpers', () => {
  it('creates custom themes with slugs of their own', () => {
    const created = createCustomTheme('Mine', {light: {accent: '#ff0000'}})

    expect(created.slug).toMatch(/^custom-/)
    expect(created).toMatchObject({title: 'Mine', options: {light: {accent: '#ff0000'}}})
    expect(createCustomTheme('Other', {}).slug).not.toBe(created.slug)
  })

  it('titles duplicates and untitled themes', () => {
    expect(duplicateTitle('Verdant')).toBe('Verdant copy')
    expect(duplicateTitle('  ')).toBe('Untitled theme copy')
    expect(displayTitle(' Mine ')).toBe('Mine')
    expect(displayTitle('')).toBe('Untitled theme')
  })
})
