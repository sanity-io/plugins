import {afterEach, describe, expect, test} from 'vitest'

import {createPresetsRegistry} from './registry'
import {_clearAllRegistriesForTesting} from './telemetry'

describe('createPresetsRegistry', () => {
  afterEach(() => {
    _clearAllRegistriesForTesting()
  })

  test('returns an object with define<Name> functions for all system presets', () => {
    const registry = createPresetsRegistry()

    expect(typeof registry.defineLink).toBe('function')
    expect(typeof registry.defineCta).toBe('function')
    expect(typeof registry.defineSeo).toBe('function')
    expect(typeof registry.defineImage).toBe('function')
    expect(typeof registry.definePage).toBe('function')
  })

  test('defineLink returns a schema type definition', () => {
    const registry = createPresetsRegistry()
    const result = registry.defineLink({name: 'testLink'})

    expect(result).toHaveProperty('name', 'testLink')
    expect(result).toHaveProperty('type', 'object')
  })

  test('defineLink reflects registry-level internalTypes', () => {
    const registry = createPresetsRegistry({
      link: {internalTypes: ['marketingPage']},
    })
    const result = registry.defineLink({name: 'testLink'})

    // oxlint-disable-next-line no-unsafe-type-assertion -- narrowing result to access fields
    const fields = (result as {fields?: Array<{name: string; to?: Array<{type: string}>}>}).fields
    const referenceField = fields?.find((f) => f.name === 'reference')
    expect(referenceField?.to).toEqual([{type: 'marketingPage'}])
  })

  test('defineCta returns a schema type definition', () => {
    const registry = createPresetsRegistry()
    const result = registry.defineCta({name: 'testCta'})

    expect(result).toHaveProperty('name', 'testCta')
    expect(result).toHaveProperty('type', 'object')
  })

  test('defineSeo returns a schema type definition', () => {
    const registry = createPresetsRegistry()
    const result = registry.defineSeo({name: 'testSeo'})

    expect(result).toHaveProperty('name', 'testSeo')
    expect(result).toHaveProperty('type', 'object')
  })

  test('defineImage returns a schema type definition', () => {
    const registry = createPresetsRegistry()
    const result = registry.defineImage({name: 'testImage'})

    expect(result).toHaveProperty('name', 'testImage')
    expect(result).toHaveProperty('type', 'object')
  })

  test('definePage returns a schema type definition', () => {
    const registry = createPresetsRegistry()
    const result = registry.definePage({name: 'testPage'})

    expect(result).toHaveProperty('name', 'testPage')
    expect(result).toHaveProperty('type', 'document')
  })

  test('throws for invalid preset name with periods', () => {
    expect(() =>
      createPresetsRegistry({
        extensions: [
          // oxlint-disable-next-line no-unsafe-type-assertion -- test invalid input
          Object.assign(
            () => [
              {
                name: 'invalid.name',
                type: {name: 'test', type: 'object' as const, fields: []},
              },
            ],
            {},
          ) as never,
        ],
      }),
    ).toThrow(/Invalid preset name/)
  })
})
