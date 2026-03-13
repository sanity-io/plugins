import {afterEach, describe, expect, test, vi} from 'vitest'

import {collectTypes} from '../../composer'
import {LINK_FIELD_TYPE} from './constants'
import {linkField} from './index'

describe('collectTypes with linkField presets', () => {
  afterEach(() => vi.restoreAllMocks())

  test('multiple linkField presets with different names coexist', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const types = collectTypes([
      linkField({internalTypes: ['page']}),
      linkField({name: 'navLink', internalTypes: ['post']}),
    ])
    const typeNames = types.map((type) => type.name)

    expect(typeNames).toEqual([LINK_FIELD_TYPE, 'navLink'])
    expect(warnSpy).toHaveBeenCalledTimes(0)
  })

  test('duplicate default linkField presets warn and keep first', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const types = collectTypes([
      linkField({internalTypes: ['page']}),
      linkField({internalTypes: ['post']}),
    ])
    const typeNames = types.map((type) => type.name)

    expect(typeNames).toEqual([LINK_FIELD_TYPE])
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith(
      `[@sanity/presets] Dropped duplicate type "${LINK_FIELD_TYPE}". Keeping first definition.`,
    )
  })

  test('duplicate custom-named linkField presets warn and keep first', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const types = collectTypes([
      linkField({name: 'navLink', internalTypes: ['page']}),
      linkField({name: 'navLink', internalTypes: ['post']}),
    ])
    const typeNames = types.map((type) => type.name)

    expect(typeNames).toEqual(['navLink'])
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith(
      '[@sanity/presets] Dropped duplicate type "navLink". Keeping first definition.',
    )
  })

  test('three linkField variants with mixed duplicates', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const types = collectTypes([
      linkField({internalTypes: ['page']}),
      linkField({name: 'navLink', internalTypes: ['post']}),
      linkField({internalTypes: ['article']}),
      linkField({name: 'navLink', internalTypes: ['event']}),
    ])
    const typeNames = types.map((type) => type.name)

    expect(typeNames).toEqual([LINK_FIELD_TYPE, 'navLink'])
    expect(warnSpy).toHaveBeenCalledTimes(2)
    expect(warnSpy).toHaveBeenCalledWith(
      `[@sanity/presets] Dropped duplicate type "${LINK_FIELD_TYPE}". Keeping first definition.`,
    )
    expect(warnSpy).toHaveBeenCalledWith(
      '[@sanity/presets] Dropped duplicate type "navLink". Keeping first definition.',
    )
  })
})
