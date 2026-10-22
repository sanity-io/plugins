import {describe, expect, it} from 'vitest'

import {tag, tagReference} from '../__tests__/fixtures/documents'
import type {TagItem} from '../types'
import {mergeTagReferences} from './mergeTagReferences'

const loaded = (...tags: [id: string, name: string][]): Record<string, TagItem> =>
  Object.fromEntries(
    tags.map(([id, name]) => [id, {_type: 'tag', tag: tag(id, name), updating: false}]),
  )

const option = (value: string) => ({label: value, value})

describe('mergeTagReferences', () => {
  it('keeps every reference while tags are not loaded', () => {
    const references = [tagReference('t1'), tagReference('t2')]

    expect(mergeTagReferences({picked: null, references, shown: null, tagsById: {}})).toEqual(
      references,
    )
  })

  it('removes the shown tags that are no longer picked', () => {
    const tagsById = loaded(['t1', 'product'], ['t2', 'sale'])
    const references = [tagReference('t1'), tagReference('t2')]
    const shown = [option('t1'), option('t2')]

    expect(mergeTagReferences({picked: [option('t2')], references, shown, tagsById})).toEqual([
      tagReference('t2'),
    ])
    expect(mergeTagReferences({picked: null, references, shown, tagsById})).toBeNull()
  })

  it('keeps references to tags the form did not show', () => {
    const tagsById = loaded(['t1', 'product'], ['t2', 'sale'])

    expect(
      mergeTagReferences({
        picked: [],
        references: [tagReference('unknown'), tagReference('t1'), tagReference('t2')],
        // `t2` resolved once the tags were being edited
        shown: [option('t1')],
        tagsById,
      }),
    ).toEqual([tagReference('unknown'), tagReference('t2')])
  })

  it('removes shown tags that were deleted since', () => {
    expect(
      mergeTagReferences({
        picked: [option('t1')],
        references: [tagReference('t1')],
        shown: [option('t1')],
        tagsById: {},
      }),
    ).toBeNull()
  })

  it('appends newly picked tags with a key, skipping tags that no longer exist', () => {
    const tagsById = loaded(['t1', 'product'], ['t2', 'sale'])

    expect(
      mergeTagReferences({
        picked: [option('t1'), option('t2'), option('deleted')],
        references: [tagReference('t1')],
        shown: [option('t1')],
        tagsById,
      }),
    ).toEqual([
      tagReference('t1'),
      {_key: expect.any(String), _ref: 't2', _type: 'reference', _weak: true},
    ])
  })
})
