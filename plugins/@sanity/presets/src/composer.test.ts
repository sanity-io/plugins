import {defineType} from 'sanity'
import {describe, expect, test, vi} from 'vitest'

import {collectTypes, presetsComposer} from './composer'
import type {PresetResult} from './types'

function createPreset(typeNames: string[]): PresetResult {
  return {
    types: typeNames.map((name) => defineType({name, type: 'object', fields: []})),
  }
}

describe('presetsComposer', () => {
  test('returns plugin with no types for empty array', () => {
    const result = presetsComposer([])

    expect(result.name).toBe('@sanity/presets')
    expect(result.schema?.types).toEqual([])
  })

  test('aggregates types from a single preset', () => {
    const result = presetsComposer([createPreset(['test.type'])])

    expect(result.schema?.types).toEqual([expect.objectContaining({name: 'test.type'})])
  })

  test('aggregates types from multiple presets', () => {
    const result = presetsComposer([
      createPreset(['type.a']),
      createPreset(['type.b']),
      createPreset(['type.c', 'type.d']),
    ])

    expect(result.schema?.types).toEqual([
      expect.objectContaining({name: 'type.a'}),
      expect.objectContaining({name: 'type.b'}),
      expect.objectContaining({name: 'type.c'}),
      expect.objectContaining({name: 'type.d'}),
    ])
  })
})

describe('collectTypes', () => {
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

  test('deduplicates separately created presets with matching type names', () => {
    const first = createPreset(['link.type'])
    const second = createPreset(['link.type'])

    const types = collectTypes([first, second])
    const typeNames = types.map((type) => type.name)

    expect(typeNames).toEqual(['link.type'])
  })

  test('deduplicates by type name across different presets and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const presetA = createPreset(['shared.type', 'alpha.type'])
    const presetB = createPreset(['shared.type', 'beta.type'])

    const types = collectTypes([presetA, presetB])
    const typeNames = types.map((type) => type.name)

    expect(typeNames).toEqual(['shared.type', 'alpha.type', 'beta.type'])
    expect(warnSpy).toHaveBeenCalledWith(
      '[@sanity/presets] Duplicate type "shared.type" was dropped. The first definition will be used.',
    )

    warnSpy.mockRestore()
  })

  test('keeps unique names and drops repeated ones across three presets', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const types = collectTypes([
      createPreset(['core.presets.link', 'core.presets.seo']),
      createPreset(['core.presets.link']),
      createPreset(['core.presets.link', 'core.presets.seo']),
    ])
    const typeNames = types.map((type) => type.name)

    expect(typeNames).toEqual(['core.presets.link', 'core.presets.seo'])
    expect(warnSpy).toHaveBeenCalledTimes(3)

    warnSpy.mockRestore()
  })
})
