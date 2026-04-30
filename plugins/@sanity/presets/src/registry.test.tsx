/// <reference types="@testing-library/jest-dom" />
import {cleanup, render, screen} from '@testing-library/react'
import type {FunctionComponent} from 'react'
import type {IntrinsicTypeName, InputProps} from 'sanity'
import {afterEach, assert, describe, expect, vi} from 'vitest'

import {getPresetKey} from './registry'
import {test} from './test/fixtures'

afterEach(() => {
  cleanup()
})

describe('createPresetsRegistry', () => {
  test('returns an object with define<Name> functions for all system presets', ({registry}) => {
    expect(typeof registry.defineLink).toBe('function')
    expect(typeof registry.defineCta).toBe('function')
    expect(typeof registry.defineSeo).toBe('function')
    expect(typeof registry.defineImage).toBe('function')
    expect(typeof registry.definePage).toBe('function')
  })

  // Mirrors Sanity's `IntrinsicTypeName` union. The `Record` shape is
  // exhaustive over `IntrinsicTypeName`, so adding a new intrinsic upstream
  // surfaces here as a TypeScript error instead of as a Studio boot error
  // when a preset default silently collides with the new built-in.
  const RESERVED_NAME_RECORD: Record<IntrinsicTypeName, true> = {
    array: true,
    block: true,
    boolean: true,
    crossDatasetReference: true,
    date: true,
    datetime: true,
    document: true,
    email: true,
    file: true,
    geopoint: true,
    globalDocumentReference: true,
    image: true,
    number: true,
    object: true,
    reference: true,
    slug: true,
    string: true,
    text: true,
    url: true,
  }
  const RESERVED_TYPE_NAMES = new Set(Object.keys(RESERVED_NAME_RECORD))

  test('every define<Name>() with no args produces a non-reserved schema name', ({registry}) => {
    const definers = Object.entries(registry).filter(
      (entry): entry is [string, (config?: Record<string, unknown>) => {name: string}] =>
        entry[0].startsWith('define') && typeof entry[1] === 'function',
    )

    expect(definers.length).toBeGreaterThan(0)

    definers.forEach(([key, define]) => {
      const result = define()
      expect(
        RESERVED_TYPE_NAMES.has(result.name),
        `${key}() produced reserved schema name "${result.name}"`,
      ).toBe(false)
    })
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

  test('non-standard config properties (like map) do not leak into the schema type', ({
    registry,
  }) => {
    const result = registry.definePage({
      name: 'testPage',
      map: {
        fields: (fields = []) => fields,
      },
    })

    expect(result).not.toHaveProperty('map')
  })
})

describe('createPresetsRegistry components.input wrapping', () => {
  test('user-provided components.input is rendered inside the telemetry wrapper', ({registry}) => {
    const userInput = vi.fn(() => <div data-testid="user-input">User input</div>)

    const schemaType = registry.defineLink({
      name: 'myLink',
      components: {input: userInput},
    })

    assert(
      'components' in schemaType &&
        schemaType.components &&
        'input' in schemaType.components &&
        typeof schemaType.components.input === 'function',
      'Expected components.input to be a function set by the registry',
    )
    // oxlint-disable-next-line no-unsafe-type-assertion -- the registry installs a FunctionComponent<InputProps> wrapper on every preset it produces
    const TelemetryWrapper = schemaType.components.input as unknown as FunctionComponent<InputProps>

    // The registry must not replace the user's input with the telemetry wrapper —
    // it must render the user's input inside the wrapper so both behaviours run.
    expect(TelemetryWrapper).not.toBe(userInput)

    const renderDefault = vi.fn(() => <div data-testid="default-input">Default input</div>)

    // oxlint-disable-next-line no-unsafe-type-assertion -- minimal stub of InputProps for render test
    const props = {renderDefault} as unknown as InputProps

    render(<TelemetryWrapper {...props} />)

    expect(userInput).toHaveBeenCalledOnce()
    expect(screen.getByTestId('user-input')).toBeInTheDocument()
    expect(screen.queryByTestId('default-input')).not.toBeInTheDocument()
  })

  test('when no user components.input is provided, the telemetry wrapper falls back to renderDefault', ({
    registry,
  }) => {
    const schemaType = registry.defineLink({name: 'myLink'})

    assert(
      'components' in schemaType &&
        schemaType.components &&
        'input' in schemaType.components &&
        typeof schemaType.components.input === 'function',
      'Expected components.input to be a function set by the registry',
    )
    // oxlint-disable-next-line no-unsafe-type-assertion -- the registry installs a FunctionComponent<InputProps> wrapper on every preset it produces
    const TelemetryWrapper = schemaType.components.input as unknown as FunctionComponent<InputProps>

    const renderDefault = vi.fn(() => <div data-testid="default-input">Default input</div>)

    // oxlint-disable-next-line no-unsafe-type-assertion -- minimal stub of InputProps for render test
    const props = {renderDefault} as unknown as InputProps

    render(<TelemetryWrapper {...props} />)

    expect(renderDefault).toHaveBeenCalled()
    expect(screen.getByTestId('default-input')).toBeInTheDocument()
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
