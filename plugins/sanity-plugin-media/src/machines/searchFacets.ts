import {uuid} from '@sanity/uuid'

import type {SearchFacetInputProps, SearchFacetOperatorType, Tag, WithId} from '../types'

export type SearchFacet = WithId<SearchFacetInputProps>

export type SearchFacetUpdate = {
  modifier?: string
  operatorType?: SearchFacetOperatorType
  value?: unknown
}

export function addSearchFacet(facets: SearchFacet[], facet: SearchFacetInputProps): SearchFacet[] {
  return [...facets, {...facet, id: uuid()}]
}

function applyUpdate(facet: SearchFacet, {modifier, operatorType, value}: SearchFacetUpdate) {
  return {
    ...facet,
    ...(facet.type === 'number' && modifier ? {modifier} : {}),
    ...(operatorType ? {operatorType} : {}),
    ...(typeof value === 'undefined' ? {} : {value}),
  } as SearchFacet
}

export function updateSearchFacetById(
  facets: SearchFacet[],
  id: string,
  update: SearchFacetUpdate,
): SearchFacet[] {
  return facets.map((facet) => (facet.id === id ? applyUpdate(facet, update) : facet))
}

/** Updates the first facet named `name`, and drops any other facet with that name. */
export function updateSearchFacetByName(
  facets: SearchFacet[],
  name: string,
  update: SearchFacetUpdate,
): SearchFacet[] {
  const target = facets.find((facet) => facet.name === name)
  if (!target) {
    return facets
  }
  return facets.flatMap((facet) => {
    if (facet.id === target.id) {
      return [applyUpdate(facet, update)]
    }
    return facet.name === name ? [] : [facet]
  })
}

export function removeSearchFacet(facets: SearchFacet[], id: string): SearchFacet[] {
  return facets.filter((facet) => facet.id !== id)
}

export function isTagSearchFacet(facet: SearchFacetInputProps, tagId: string): boolean {
  return (
    facet.name === 'tag' &&
    facet.type === 'searchable' &&
    (facet.operatorType === 'references' || facet.operatorType === 'doesNotReference') &&
    facet.value?.value === tagId
  )
}

export function removeTagSearchFacets(facets: SearchFacet[], tagId: string): SearchFacet[] {
  return facets.filter((facet) => !isTagSearchFacet(facet, tagId))
}

/** Keeps the label of tag facets in sync with a renamed tag. The query itself uses the tag id. */
export function renameTagSearchFacets(facets: SearchFacet[], tag: Tag): SearchFacet[] {
  if (!facets.some((facet) => facet.type === 'searchable' && facet.value?.value === tag._id)) {
    return facets
  }
  return facets.map((facet) =>
    facet.type === 'searchable' && facet.value?.value === tag._id
      ? {...facet, value: {label: tag.name.current, value: tag._id}}
      : facet,
  )
}
