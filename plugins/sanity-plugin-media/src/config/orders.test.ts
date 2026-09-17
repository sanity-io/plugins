// @vitest-environment node

import {describe, expect, it} from 'vitest'

import {getOrderField, getOrderTitle} from './orders'

describe('getOrderTitle', () => {
  it('returns the dictionary label for a field/direction pair', () => {
    expect(getOrderTitle('title', 'asc')).toBe('Title: A to Z')
    expect(getOrderTitle('originalFilename', 'desc')).toBe('File name: Z to A')
  })
})

describe('getOrderField', () => {
  it('returns non-localized fields as-is regardless of configured locales', () => {
    expect(getOrderField('originalFilename', [])).toBe('originalFilename')
    expect(getOrderField('originalFilename', ['en', 'nb'])).toBe('originalFilename')
    expect(getOrderField('size', ['en'])).toBe('size')
  })

  it('returns the localized field as-is when no locales are configured', () => {
    expect(getOrderField('title', [])).toBe('title')
  })

  it('coalesces through configured locales, in declared order, for a localized field', () => {
    expect(getOrderField('title', ['en', 'nb'])).toBe('coalesce(title["en"], title["nb"])')
  })

  it('safely escapes locale ids that contain special characters', () => {
    expect(getOrderField('title', ['en-US'])).toBe('coalesce(title["en-US"])')
  })
})
