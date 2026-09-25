import {describe, expect, it} from 'vitest'

import {tag} from '../__tests__/fixtures/documents'
import {inputs} from '../config/searchFacets'
import type {SearchFacetInputProps} from '../types'
import {
  addSearchFacet,
  isTagSearchFacet,
  removeSearchFacet,
  removeTagSearchFacets,
  renameTagSearchFacets,
  type SearchFacet,
  updateSearchFacetById,
  updateSearchFacetByName,
} from './searchFacets'

const tagFacet = (tagId: string, operatorType = 'references') =>
  ({
    ...inputs.tag,
    id: `facet-${tagId}-${operatorType}`,
    operatorType,
    value: {label: tagId, value: tagId},
  }) as SearchFacet

const withId = (facet: SearchFacetInputProps, id: string) => ({...facet, id}) as SearchFacet

describe('search facets', () => {
  it('gives added facets an id', () => {
    const facets = addSearchFacet(addSearchFacet([], inputs.title), inputs.title)

    expect(facets.map((facet) => facet.name)).toEqual(['title', 'title'])
    expect(new Set(facets.map((facet) => facet.id)).size).toBe(2)
  })

  it('updates the operator, value and number modifier of a facet', () => {
    const size = withId(inputs.size, 'size')
    const title = withId(inputs.title, 'title')

    const [updatedSize, updatedTitle] = updateSearchFacetById(
      updateSearchFacetById([size, title], 'size', {modifier: 'megabytes', value: 2}),
      'title',
      {modifier: 'megabytes', operatorType: 'doesNotInclude'},
    )

    expect(updatedSize).toMatchObject({modifier: 'megabytes', value: 2})
    expect(updatedTitle).toMatchObject({operatorType: 'doesNotInclude', value: title.value})
    expect(updatedTitle).not.toHaveProperty('modifier')
  })

  it('updates the first facet with a name, dropping the others with that name', () => {
    const facets = [withId(inputs.type, 'a'), withId(inputs.title, 'b'), withId(inputs.type, 'c')]

    const updated = updateSearchFacetByName(facets, 'type', {value: 'image'})

    expect(updated.map((facet) => [facet.id, facet.value])).toEqual([
      ['a', 'image'],
      ['b', inputs.title.value],
    ])
    expect(updateSearchFacetByName(facets, 'missing', {value: 1})).toBe(facets)
  })

  it('removes facets by id', () => {
    const facets = [withId(inputs.title, 'a'), withId(inputs.title, 'b')]

    expect(removeSearchFacet(facets, 'a').map((facet) => facet.id)).toEqual(['b'])
  })

  it('recognizes and removes the facets filtering by a tag', () => {
    const empty = {...inputs.tag, operatorType: 'empty'} as SearchFacetInputProps
    const facets = [tagFacet('t1'), tagFacet('t1', 'doesNotReference'), tagFacet('t2')]

    expect(facets.map((facet) => isTagSearchFacet(facet, 't1'))).toEqual([true, true, false])
    expect(isTagSearchFacet(empty, 't1')).toBe(false)
    expect(removeTagSearchFacets(facets, 't1')).toEqual([tagFacet('t2')])
  })

  it('renames the label of facets filtering by a renamed tag', () => {
    const facets = [tagFacet('t1'), withId(inputs.title, 'title')]

    expect(renameTagSearchFacets(facets, tag('t1', 'renamed'))).toEqual([
      {...tagFacet('t1'), value: {label: 'renamed', value: 't1'}},
      facets[1],
    ])
    expect(renameTagSearchFacets(facets, tag('t2', 'other'))).toBe(facets)
  })
})
