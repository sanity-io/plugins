import {defineField, defineType} from 'sanity'
import {afterEach, describe, expect, test} from 'vitest'

import {definePresetType} from './definePresetType'
import {createPresetsRegistry} from './registry'
import {resetRegistries} from './telemetry'

describe('createPresetsRegistry', () => {
  afterEach(() => {
    resetRegistries()
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
    const invalidPreset = definePresetType((_config, _registry) => ({
      name: 'invalid.name',
      schemaType: defineType({name: 'test', type: 'object', fields: []}),
    }))

    expect(() =>
      createPresetsRegistry({
        extensions: [invalidPreset],
      }),
    ).toThrow(/Invalid preset name/)
  })

  test('extension without identifier records telemetry as "unnamed"', () => {
    const noIdentifierPreset = definePresetType<{}, 'object'>((config) => ({
      name: 'widget',
      // no identifier set
      schemaType: defineType({name: 'widget', ...config, type: 'object', fields: []}),
    }))

    const registry = createPresetsRegistry({
      extensions: [noIdentifierPreset],
    })

    const defineWidget = registry['defineWidget']!
    expect(typeof defineWidget).toBe('function')

    // Calling the define function should not throw — telemetry records 'unnamed'
    const result = defineWidget({name: 'testWidget'})
    expect(result).toHaveProperty('name', 'testWidget')
  })
})

describe('preset composition via getPreset', () => {
  afterEach(() => {
    resetRegistries()
  })

  test('defineCta resolves link fields from the registry', () => {
    const registry = createPresetsRegistry()
    const defineCta = registry['defineCta']!
    const result = defineCta({name: 'testCta'})

    // The link field should have its own fields resolved from linkType, not be empty
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

  test('defineCta link field inherits internalTypes from registry config', () => {
    const registry = createPresetsRegistry({
      link: {internalTypes: ['article', 'page']},
    })
    const defineCta = registry['defineCta']!
    const result = defineCta({name: 'testCta'})

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

  test('definePage resolves seo fields from the registry', () => {
    const registry = createPresetsRegistry()
    const definePage = registry['definePage']!
    const result = definePage({name: 'testPage'})

    // The seo field should have its own fields resolved from seoType, not be empty
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

  test('definePage seo field retains group assignment after composition', () => {
    const registry = createPresetsRegistry()
    const definePage = registry['definePage']!
    const result = definePage({name: 'testPage'})

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

  test('extension preset can use getPreset to compose system presets', () => {
    const heroType = definePresetType<{}, 'object'>((_config, registry) => {
      const linkField = Object.assign(
        defineField({name: 'heroLink', title: 'Hero Link', type: 'object', fields: []}),
        registry.getPreset('link', {name: 'heroLink', title: 'Hero Link'}),
      )

      return {
        name: 'hero',
        schemaType: defineType({
          name: 'hero',
          title: 'Hero',
          type: 'object',
          fields: [defineField({name: 'heading', type: 'string', title: 'Heading'}), linkField],
        }),
      }
    })

    const registry = createPresetsRegistry({
      link: {internalTypes: ['landingPage']},
      extensions: [heroType],
    })
    const defineHero = registry['defineHero']!
    const result = defineHero({name: 'testHero'})

    // Should have link fields resolved from linkType
    expect(result).toEqual(
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({
            name: 'heroLink',
            fields: expect.arrayContaining([
              expect.objectContaining({name: 'linkType'}),
              // Should inherit internalTypes from registry config
              expect.objectContaining({
                name: 'reference',
                to: [{type: 'landingPage'}],
              }),
            ]),
          }),
        ]),
      }),
    )
  })

  test('getPreset throws for non-existent preset name', () => {
    const badPreset = definePresetType<{}, 'object'>((_config, registry) => {
      registry.getPreset('nonExistent', {name: 'test'})

      return {
        name: 'bad',
        schemaType: defineType({name: 'bad', type: 'object', fields: []}),
      }
    })

    const registry = createPresetsRegistry({
      extensions: [badPreset],
    })
    const defineBad = registry['defineBad']!

    expect(() => defineBad({name: 'test'})).toThrow(/Cannot resolve preset "nonExistent"/)
  })
})
