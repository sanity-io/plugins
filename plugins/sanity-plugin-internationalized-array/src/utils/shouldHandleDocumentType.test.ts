import {describe, expect, test} from 'vitest'

import {shouldHandleDocumentType} from './shouldHandleDocumentType'

describe('shouldHandleDocumentType', () => {
  test('returns true for regular documents in standalone mode', () => {
    expect(
      shouldHandleDocumentType({isDocumentInternationalizationIntegration: false}, 'article'),
    ).toBe(true)
  })

  test('returns false for translation metadata in standalone mode', () => {
    expect(
      shouldHandleDocumentType(
        {isDocumentInternationalizationIntegration: false},
        'translation.metadata',
      ),
    ).toBe(false)
  })

  test('returns true for translation metadata in integration mode', () => {
    expect(
      shouldHandleDocumentType(
        {isDocumentInternationalizationIntegration: true},
        'translation.metadata',
      ),
    ).toBe(true)
  })

  test('returns false for regular documents in integration mode', () => {
    expect(
      shouldHandleDocumentType({isDocumentInternationalizationIntegration: true}, 'article'),
    ).toBe(false)
  })
})
