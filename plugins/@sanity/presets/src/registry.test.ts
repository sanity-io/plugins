import {afterEach, describe, expect, test} from 'vitest'

import {createPresetsRegistry} from './registry'
import {resetRegistries} from './telemetry'

describe('createPresetsRegistry', () => {
  afterEach(() => {
    resetRegistries()
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
    const {defineLink} = createPresetsRegistry()
    const result = defineLink({name: 'testLink'})

    expect(result).toHaveProperty('name', 'testLink')
    expect(result).toHaveProperty('type', 'object')
  })

  test('defineLink reflects registry-level internalTypes', () => {
    const {defineLink} = createPresetsRegistry({
      link: {internalTypes: ['marketingPage']},
    })
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
    const {defineCta} = createPresetsRegistry()
    const result = defineCta({name: 'testCta'})

    expect(result).toHaveProperty('name', 'testCta')
    expect(result).toHaveProperty('type', 'object')
  })

  test('defineSeo returns a schema type definition', () => {
    const {defineSeo} = createPresetsRegistry()
    const result = defineSeo({name: 'testSeo'})

    expect(result).toHaveProperty('name', 'testSeo')
    expect(result).toHaveProperty('type', 'object')
  })

  test('defineImage returns a schema type definition', () => {
    const {defineImage} = createPresetsRegistry()
    const result = defineImage({name: 'testImage'})

    expect(result).toHaveProperty('name', 'testImage')
    expect(result).toHaveProperty('type', 'object')
  })

  test('definePage returns a schema type definition', () => {
    const {definePage} = createPresetsRegistry()
    const result = definePage({name: 'testPage'})

    expect(result).toHaveProperty('name', 'testPage')
    expect(result).toHaveProperty('type', 'document')
  })
})

describe('preset composition via getPreset', () => {
  afterEach(() => {
    resetRegistries()
  })

  test('defineCta resolves link fields from the registry', () => {
    const {defineCta} = createPresetsRegistry()
    const result = defineCta({name: 'testCta'})

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
    const {defineCta} = createPresetsRegistry({
      link: {internalTypes: ['article', 'page']},
    })
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
    const {definePage} = createPresetsRegistry()
    const result = definePage({name: 'testPage'})

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
    const {definePage} = createPresetsRegistry()
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
})
