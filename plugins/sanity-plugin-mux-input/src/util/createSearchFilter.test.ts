import {describe, expect, test} from 'vitest'

import {createSearchFilter} from './createSearchFilter'

describe('createSearchFilter', () => {
  test('returns no constraints for an empty query', () => {
    expect(createSearchFilter('')).toEqual({filter: [], params: {}})
  })

  test('only searches filenames for short queries', () => {
    expect(createSearchFilter('Cat')).toEqual({
      filter: ['(filename match $t0)'],
      params: {t0: '*cat*'},
    })
  })

  test('lowercases, splits on special characters and dedupes words', () => {
    expect(createSearchFilter('The saint of Saint-Germain-des-Prés')).toEqual({
      filter: [
        '(filename match $t0 || assetId match $t0)',
        '(filename match $t1 || assetId match $t1)',
        '(filename match $t2 || assetId match $t2)',
        '(filename match $t3 || assetId match $t3)',
        '(filename match $t4 || assetId match $t4)',
        '(filename match $t5 || assetId match $t5)',
      ],
      params: {
        t0: '*the*',
        t1: '*saint*',
        t2: '*of*',
        t3: '*germain*',
        t4: '*des*',
        t5: '*prés*',
      },
    })
  })

  test('keeps quoted multi-word phrases together', () => {
    expect(createSearchFilter('"Fantastic Mr" fox FOX "foo-bar" "the" book').params).toEqual({
      t0: '*"fantastic mr"*',
      t1: '*"foo-bar"*',
      t2: '*fox*',
      t3: '*the*',
      t4: '*book*',
    })
  })

  test('strips leading dots and drops empty tokens', () => {
    expect(createSearchFilter('...clip ... intro.mp4').params).toEqual({
      t0: '*clip*',
      t1: '*intro.mp4*',
    })
  })
})
