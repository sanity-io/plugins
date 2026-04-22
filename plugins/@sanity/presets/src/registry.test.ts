import {test as baseTest, describe, expect} from 'vitest'

import type {PresetsRegistry, PresetsRegistryConfig} from './registry'
import {createPresetsRegistry, getPresetKey} from './registry'
import {resetRegistries} from './telemetry'

const test = baseTest
  .extend('registryConfig', (): PresetsRegistryConfig => ({}))
  .extend('registry', ({registryConfig}, {onCleanup}): PresetsRegistry => {
    onCleanup(() => resetRegistries())
    return createPresetsRegistry(registryConfig)
  })

describe('createPresetsRegistry', () => {
  test('returns an object with define<Name> functions for all system presets', ({registry}) => {
    expect(typeof registry.defineLink).toBe('function')
    expect(typeof registry.defineCta).toBe('function')
    expect(typeof registry.defineSeo).toBe('function')
    expect(typeof registry.defineImage).toBe('function')
    expect(typeof registry.definePage).toBe('function')
  })

  test('defineLink returns a schema type definition', ({registry}) => {
    const result = registry.defineLink({name: 'testLink'})

    expect(result).toHaveProperty('name', 'testLink')
    expect(result).toHaveProperty('type', 'object')
  })

  describe('with registry-level internalTypes', () => {
    test.override('registryConfig', {link: {internalTypes: ['marketingPage']}})

    test('defineLink reflects registry-level internalTypes', ({registry}) => {
      const result = registry.defineLink({name: 'testLink'})

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
  })

  test('defineCta returns a schema type definition', ({registry}) => {
    const result = registry.defineCta({name: 'testCta'})

    expect(result).toHaveProperty('name', 'testCta')
    expect(result).toHaveProperty('type', 'object')
  })

  test('defineSeo returns a schema type definition', ({registry}) => {
    const result = registry.defineSeo({name: 'testSeo'})

    expect(result).toHaveProperty('name', 'testSeo')
    expect(result).toHaveProperty('type', 'object')
  })

  test('defineImage returns a schema type definition', ({registry}) => {
    const result = registry.defineImage({name: 'testImage'})

    expect(result).toHaveProperty('name', 'testImage')
    expect(result).toHaveProperty('type', 'object')
  })

  test('definePage returns a schema type definition', ({registry}) => {
    const result = registry.definePage({name: 'testPage'})

    expect(result).toHaveProperty('name', 'testPage')
    expect(result).toHaveProperty('type', 'document')
  })
})

describe('preset composition via getPreset', () => {
  test('defineCta resolves link fields from the registry', ({registry}) => {
    const result = registry.defineCta({name: 'testCta'})

    expect(result).toEqual(
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({
            name: 'link',
            fields: expect.arrayContaining([
              expect.objectContaining({name: 'linkType'}),
              expect.objectContaining({name: 'reference'}),
              expect.objectContaining({name: 'url'}),
              expect.objectContaining({name: 'openInNewTab'}),
            ]),
          }),
        ]),
      }),
    )
  })

  describe('with registry-level internalTypes', () => {
    test.override('registryConfig', {link: {internalTypes: ['article', 'page']}})

    test('defineCta link field inherits internalTypes from registry config', ({registry}) => {
      const result = registry.defineCta({name: 'testCta'})

      expect(result).toEqual(
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              name: 'link',
              fields: expect.arrayContaining([
                expect.objectContaining({
                  name: 'reference',
                  to: [{type: 'article'}, {type: 'page'}],
                }),
              ]),
            }),
          ]),
        }),
      )
    })
  })

  test('definePage resolves seo fields from the registry', ({registry}) => {
    const result = registry.definePage({name: 'testPage'})

    expect(result).toEqual(
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({
            name: 'seo',
            fields: expect.arrayContaining([
              expect.objectContaining({name: 'title'}),
              expect.objectContaining({name: 'description'}),
              expect.objectContaining({name: 'ogImage'}),
            ]),
          }),
        ]),
      }),
    )
  })

  test('definePage seo field retains group assignment after composition', ({registry}) => {
    const result = registry.definePage({name: 'testPage'})

    expect(result).toEqual(
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({
            name: 'seo',
            group: 'metadata',
          }),
        ]),
      }),
    )
  })
})

describe('getPresetKey', () => {
  test('capitalizes the first letter and prepends "define"', () => {
    expect(getPresetKey('link')).toBe('defineLink')
    expect(getPresetKey('cta')).toBe('defineCta')
    expect(getPresetKey('seo')).toBe('defineSeo')
    expect(getPresetKey('image')).toBe('defineImage')
    expect(getPresetKey('page')).toBe('definePage')
  })

  test('handles multi-word names by capitalizing only the first character', () => {
    expect(getPresetKey('richText')).toBe('defineRichText')
    expect(getPresetKey('customBlock')).toBe('defineCustomBlock')
  })

  test('handles single-character names', () => {
    expect(getPresetKey('x')).toBe('defineX')
  })

  test('handles already-capitalized names', () => {
    expect(getPresetKey('Link')).toBe('defineLink')
  })

  test('returns "define" for an empty string', () => {
    expect(getPresetKey('')).toBe('define')
  })
})
