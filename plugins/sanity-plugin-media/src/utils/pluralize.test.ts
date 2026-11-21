import {describe, expect, it} from 'vitest'

import {pluralize} from './pluralize'

describe('pluralize', () => {
  it('returns the singular only for a count of 1', () => {
    expect(pluralize('asset', 1)).toBe('asset')
    expect(pluralize('asset', 0)).toBe('assets')
    expect(pluralize('asset', 2)).toBe('assets')
  })

  it('returns the plural without a count', () => {
    expect(pluralize('file')).toBe('files')
    expect(pluralize('image')).toBe('images')
  })
})
