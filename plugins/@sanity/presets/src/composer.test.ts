import {defineField, defineType} from 'sanity'
import {afterEach, assert, describe, expect, test, vi} from 'vitest'

import {collectTypes, presets} from './composer'
import {definePresetType, presetProvider} from './definePresetType'
import type {PresetResult} from './types'

function createPreset(typeNames: string[]): PresetResult[] {
  return typeNames.map((name) => {
    return {
      type: defineType({name, type: 'object', fields: []}),
      [presetProvider]: 'user',
    }
  })
}

describe('presets', () => {
  afterEach(() => vi.restoreAllMocks())

  test('returns plugin with correct name', () => {
    const result = presets()

    expect(result.name).toBe('@sanity/presets')
  })

  test('includes schema types from presets', () => {
    const result = presets(createPreset(['test.type']))

    expect(result.schema?.types).toEqual([expect.objectContaining({name: 'test.type'})])
  })

  test('deduplicates types across presets', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const preset = createPreset(['shared.type'])
    const resolvedPresets = presets(preset, preset)

    assert(Array.isArray(resolvedPresets.schema?.types))

    expect(resolvedPresets.schema.types.map(({name}) => name)).toEqual(['shared.type'])

    expect(warnSpy).toHaveBeenCalledWith(
      '[@sanity/presets] Dropped duplicate type "shared.type". Keeping first definition.',
    )
  })

  test('tags composed presets with the correct provider', () => {
    const alphaPreset = definePresetType(() => ({
      schemaType: defineType({
        name: 'alpha',
        type: 'object',
        fields: [
          defineField({
            name: 'alphaName',
            type: 'string',
          }),
        ],
      }),
    }))

    const betaPreset = definePresetType(() => ({
      composes: [alphaPreset],
      schemaType: defineType({
        name: 'beta',
        type: 'object',
        fields: [
          defineField({
            name: 'betaName',
            type: 'string',
          }),
        ],
      }),
    }))

    expect(alphaPreset().find(({type}) => type.name === 'alpha')?.[presetProvider]).toEqual('user')

    expect(betaPreset().find(({type}) => type.name === 'alpha')?.[presetProvider]).toEqual('system')
    expect(betaPreset().find(({type}) => type.name === 'beta')?.[presetProvider]).toEqual('user')
  })

  test('errors upon circular dependencies', () => {
    // @ts-expect-error contrived example possible at runtime
    const alphaPreset = definePresetType(() => ({
      composes: [alphaPreset],
      schemaType: defineType({
        name: 'alpha',
        type: 'object',
        fields: [
          defineField({
            name: 'alphaName',
            type: 'string',
          }),
        ],
      }),
    }))

    expect(alphaPreset).toThrowErrorMatchingInlineSnapshot(
      `[Error: Found circular dependency resolving preset \`alpha\`.]`,
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
