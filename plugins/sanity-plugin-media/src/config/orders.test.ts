// @vitest-environment node

import {describe, expect, it} from 'vitest'

import {getOrderField, getOrderTitle, getOrderValue} from './orders'

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

describe('getOrderValue', () => {
  it('returns non-localized values as-is', () => {
    expect(getOrderValue('photo.jpg', 'originalFilename', ['en'])).toBe('photo.jpg')
    expect(getOrderValue(1024, 'size', ['en'])).toBe(1024)
  })

  it('returns the value as-is when no locales are configured', () => {
    expect(getOrderValue('My photo', 'title', [])).toBe('My photo')
  })

  it('picks the first available translation, in declared locale order', () => {
    expect(getOrderValue({en: 'Apple', nb: 'Eple'}, 'title', ['nb', 'en'])).toBe('Eple')
    expect(getOrderValue({en: 'Apple'}, 'title', ['nb', 'en'])).toBe('Apple')
  })

  it('returns undefined when no configured locale has a value', () => {
    expect(getOrderValue({fr: 'Pomme'}, 'title', ['nb', 'en'])).toBeUndefined()
    expect(getOrderValue(undefined, 'title', ['en'])).toBeUndefined()
  })
})
