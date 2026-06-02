import {getImageDimensions} from '@sanity/asset-utils'
import type {ImageValue, Rule} from 'sanity'
import {beforeEach, describe, expect, vi} from 'vitest'

import {getField, getFields, test} from '../../test/fixtures'
import {seoType} from './index'

vi.mock('@sanity/asset-utils', () => ({
  getImageDimensions: vi.fn(),
}))

const getImageDimensionsMock = vi.mocked(getImageDimensions)

const stubRegistry = {
  getPreset: vi.fn(),
}

type OgImageValidator = (value: ImageValue | undefined) => unknown

interface RuleMock {
  custom: (validator: OgImageValidator) => RuleMock
  warning: () => RuleMock
}

interface ResolvedValidator {
  validate: OgImageValidator
  isWarning: boolean
}

function resolveOgImageValidator(): ResolvedValidator {
  const ogImageField = getField(
    getFields(seoType.schemaType({name: 'seo'}, stubRegistry)),
    'ogImage',
  )

  const validationBuilder = ogImageField.validation

  if (typeof validationBuilder !== 'function') {
    throw new Error('ogImage field is missing a validation builder')
  }

  let capturedValidator: OgImageValidator | undefined
  let isWarning = false

  const ruleMock: RuleMock = {
    custom(validator) {
      capturedValidator = validator
      return ruleMock
    },
    warning() {
      isWarning = true
      return ruleMock
    },
  }

  // The ogImage validation builder expects a full Sanity Rule; the test only needs
  // the custom and warning methods, so a minimal mock stands in for it.
  // oxlint-disable-next-line no-unsafe-type-assertion
  validationBuilder(ruleMock as unknown as Rule)

  if (!capturedValidator) {
    throw new Error('ogImage validation did not register a custom validator')
  }

  return {validate: capturedValidator, isWarning}
}

function buildImageValue(assetRef: string | undefined): ImageValue {
  if (assetRef === undefined) {
    return {_type: 'image'}
  }

  return {_type: 'image', asset: {_type: 'reference', _ref: assetRef}}
}

describe('seoType ogImage validation', () => {
  beforeEach(() => {
    getImageDimensionsMock.mockReset()
  })

  test('registers the dimension check at warning level rather than error level', () => {
    const {isWarning} = resolveOgImageValidator()

    expect(isWarning).toBe(true)
  })

  test('returns true when no asset reference is present', () => {
    const {validate} = resolveOgImageValidator()

    expect(validate(buildImageValue(undefined))).toBe(true)
    expect(getImageDimensionsMock).not.toHaveBeenCalled()
  })

  test('returns true when the image is exactly 1200x630', () => {
    getImageDimensionsMock.mockReturnValue({width: 1200, height: 630, aspectRatio: 1200 / 630})

    const {validate} = resolveOgImageValidator()

    expect(validate(buildImageValue('image-abc-1200x630-png'))).toBe(true)
  })

  test('returns a warning message string (never an error object) for non-conformant dimensions', () => {
    getImageDimensionsMock.mockReturnValue({width: 1200, height: 1200, aspectRatio: 1})

    const {validate} = resolveOgImageValidator()
    const result = validate(buildImageValue('image-abc-1200x1200-png'))

    expect(typeof result).toBe('string')
  })

  test('includes the recommended dimensions and ratio in the warning message', () => {
    getImageDimensionsMock.mockReturnValue({width: 800, height: 600, aspectRatio: 800 / 600})

    const {validate} = resolveOgImageValidator()
    const result = validate(buildImageValue('image-abc-800x600-png'))

    expect(result).toContain('1200x630')
    expect(result).toContain('1.91:1')
  })
})
