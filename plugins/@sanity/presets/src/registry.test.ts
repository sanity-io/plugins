import {defineType} from 'sanity'
import {afterEach, describe, expect, test} from 'vitest'

import {definePresetType} from './definePresetType'
import {createPresetsRegistry} from './registry'
import {_clearAllRegistriesForTesting} from './telemetry'

describe('createPresetsRegistry', () => {
  afterEach(() => {
    _clearAllRegistriesForTesting()
  })

  test('returns an object with define<Name> functions for all system presets', () => {
    const registry = createPresetsRegistry()

    expect(typeof registry['defineLink']).toBe('function')
    expect(typeof registry['defineCta']).toBe('function')
    expect(typeof registry['defineSeo']).toBe('function')
    expect(typeof registry['defineImage']).toBe('function')
    expect(typeof registry['definePage']).toBe('function')
  })

  test('defineLink returns a schema type definition', () => {
    const registry = createPresetsRegistry()
    const defineLink = registry['defineLink']!
    const result = defineLink({name: 'testLink'})

    expect(result).toHaveProperty('name', 'testLink')
    expect(result).toHaveProperty('type', 'object')
  })

  test('defineLink reflects registry-level internalTypes', () => {
    const registry = createPresetsRegistry({
      link: {internalTypes: ['marketingPage']},
    })
    const defineLink = registry['defineLink']!
    const result = defineLink({name: 'testLink'})

    expect(result).toEqual(
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({
            name: 'reference',
            to: [{type: 'marketingPage'}],
          }),
        ]),
      }),
    )
  })

  test('defineCta returns a schema type definition', () => {
    const registry = createPresetsRegistry()
    const defineCta = registry['defineCta']!
    const result = defineCta({name: 'testCta'})

    expect(result).toHaveProperty('name', 'testCta')
    expect(result).toHaveProperty('type', 'object')
  })

  test('defineSeo returns a schema type definition', () => {
    const registry = createPresetsRegistry()
    const defineSeo = registry['defineSeo']!
    const result = defineSeo({name: 'testSeo'})

    expect(result).toHaveProperty('name', 'testSeo')
    expect(result).toHaveProperty('type', 'object')
  })

  test('defineImage returns a schema type definition', () => {
    const registry = createPresetsRegistry()
    const defineImage = registry['defineImage']!
    const result = defineImage({name: 'testImage'})

    expect(result).toHaveProperty('name', 'testImage')
    expect(result).toHaveProperty('type', 'object')
  })

  test('definePage returns a schema type definition', () => {
    const registry = createPresetsRegistry()
    const definePage = registry['definePage']!
    const result = definePage({name: 'testPage'})

    expect(result).toHaveProperty('name', 'testPage')
    expect(result).toHaveProperty('type', 'document')
  })

  test('throws for invalid preset name with periods', () => {
    const invalidPreset = definePresetType(() => ({
      name: 'invalid.name',
      schemaType: defineType({name: 'test', type: 'object', fields: []}),
    }))

    expect(() =>
      createPresetsRegistry({
        extensions: [invalidPreset],
      }),
    ).toThrow(/Invalid preset name/)
  })
})
