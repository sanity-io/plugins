import {defineType} from 'sanity'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {collectTypes, presetsComposer} from './composer'
import type {PresetResult} from './types'

function createPreset(typeNames: string[]): PresetResult {
  return {
    types: typeNames.map((name) => defineType({name, type: 'object', fields: []})),
  }
}

describe('presetsComposer', () => {
  afterEach(() => vi.restoreAllMocks())

  test('returns plugin with correct name', () => {
    const result = presetsComposer([])

    expect(result.name).toBe('@sanity/presets')
  })

  test('includes schema types from presets', () => {
    const result = presetsComposer([createPreset(['test.type'])])

    expect(result.schema?.types).toEqual([expect.objectContaining({name: 'test.type'})])
  })

  test('deduplicates types across presets', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const preset = createPreset(['shared.type'])

    presetsComposer([preset, preset])

    expect(warnSpy).toHaveBeenCalledWith(
      '[@sanity/presets] Dropped duplicate type "shared.type". Keeping first definition.',
    )
  })
})

describe('collectTypes', () => {
  afterEach(() => vi.restoreAllMocks())

  test('returns empty array for empty input', () => {
    const types = collectTypes([])

    expect(types).toEqual([])
  })

  test('deduplicates when the same preset appears multiple times', () => {
    const preset = createPreset(['link.type'])

    const types = collectTypes([preset, preset])
    const typeNames = types.map((type) => type.name)

    expect(typeNames).toEqual(['link.type'])
  })

  test('deduplicates matching type names across presets', () => {
    const first = createPreset(['link.type'])
    const second = createPreset(['link.type'])

    const types = collectTypes([first, second])
    const typeNames = types.map((type) => type.name)

    expect(typeNames).toEqual(['link.type'])
  })

  test('deduplicates by type name across presets and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const presetA = createPreset(['shared.type', 'alpha.type'])
    const presetB = createPreset(['shared.type', 'beta.type'])

    const types = collectTypes([presetA, presetB])
    const typeNames = types.map((type) => type.name)

    expect(typeNames).toEqual(['shared.type', 'alpha.type', 'beta.type'])
    expect(warnSpy).toHaveBeenCalledWith(
      '[@sanity/presets] Dropped duplicate type "shared.type". Keeping first definition.',
    )
  })

  test('keeps unique names and drops duplicates across three presets', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const types = collectTypes([
      createPreset(['core.presets.link', 'core.presets.seo']),
      createPreset(['core.presets.link']),
      createPreset(['core.presets.link', 'core.presets.seo']),
    ])
    const typeNames = types.map((type) => type.name)

    expect(typeNames).toEqual(['core.presets.link', 'core.presets.seo'])
    expect(warnSpy).toHaveBeenCalledTimes(3)
  })
})
