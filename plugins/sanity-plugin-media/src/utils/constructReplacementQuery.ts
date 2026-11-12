import groq from 'groq'

import {
  buildExcludeMediaLibraryFragment,
  buildExcludeTagsFragment,
  textSearchFieldList,
} from './constructFilter'

export const REPLACEMENT_PAGE_SIZE = 100

export type ReplacementQueryParams = {
  assetToReplaceId: string
  end: number
  folderId?: string
  searchPattern?: string
  start: number
  tagId?: string
}

export type ReplacementFilters = {
  folderId: string | null
  searchQuery: string
  tagId: string | null
}

/**
 * Builds the query used by the replace dialog to list candidate images.
 *
 * The dialog runs its own search, independent of the browser's search, facets and
 * folder scope. Only plugin configuration (`excludeTags`, `locales`,
 * `showMediaLibraryAssets`) carries over. User input is passed as query params, never interpolated.
 */
export function constructReplacementQuery({
  assetToReplaceId,
  excludeTagSlugs,
  filters,
  localeIds,
  pageIndex,
  showMediaLibraryAssets,
}: {
  assetToReplaceId: string
  excludeTagSlugs: string[]
  filters: ReplacementFilters
  /** Configured plugin locale ids, so localized text fields match like in the browser's search. */
  localeIds?: string[]
  pageIndex: number
  showMediaLibraryAssets: boolean
}): {params: ReplacementQueryParams; query: string} {
  const searchQuery = filters.searchQuery.trim()

  const params: ReplacementQueryParams = {
    assetToReplaceId,
    end: (pageIndex + 1) * REPLACEMENT_PAGE_SIZE,
    start: pageIndex * REPLACEMENT_PAGE_SIZE,
  }

  const fragments = [
    groq`_type == "sanity.imageAsset" && !(_id in path("drafts.**")) && _id != $assetToReplaceId`,
    buildExcludeMediaLibraryFragment(showMediaLibraryAssets),
    buildExcludeTagsFragment(excludeTagSlugs),
  ]

  if (searchQuery) {
    params.searchPattern = `*${searchQuery}*`
    fragments.push(groq`[${textSearchFieldList(localeIds)}] match $searchPattern`)
  }
  if (filters.tagId) {
    params.tagId = filters.tagId
    fragments.push(groq`references($tagId)`)
  }
  if (filters.folderId) {
    params.folderId = filters.folderId
    fragments.push(groq`opt.media.folder._ref == $folderId`)
  }

  const queryFilter = fragments.filter(Boolean).join(' && ')

  const query = groq`*[${queryFilter}] {
    _id,
    _type,
    _createdAt,
    _updatedAt,
    altText,
    extension,
    metadata {
      dimensions,
      isOpaque,
    },
    mimeType,
    originalFilename,
    size,
    title,
    url
  } | order(_createdAt desc) [$start...$end]`

  return {params, query}
}
