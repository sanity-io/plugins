import groq from 'groq'

import {operators} from '../config/searchFacets'
import {MEDIA_LIBRARY_REF_PREFIX, MEDIA_LIBRARY_SOURCE_NAME, TAG_DOCUMENT_NAME} from '../constants'
import type {AssetType, SearchFacetInputProps} from '../types'

/** GROQ fragment that excludes assets tagged with any of the given media.tag slugs. */
export const buildExcludeTagsFragment = (excludeTagSlugs?: string[]): string | undefined => {
  const serializedExcludeTagSlugs = excludeTagSlugs?.length
    ? JSON.stringify(excludeTagSlugs)
    : undefined

  return serializedExcludeTagSlugs
    ? groq`!(defined(opt.media.tags) && count(opt.media.tags[@._ref in *[_type == "${TAG_DOCUMENT_NAME}" && name.current in ${serializedExcludeTagSlugs}]._id]) > 0)`
    : undefined
}

/**
 * GROQ fragment that excludes assets managed by the Sanity Media Library.
 * Returns `undefined` (no filtering) when `showMediaLibraryAssets` is `true`.
 *
 * A Media Library asset is a `sanity.imageAsset`/`sanity.fileAsset` document
 * linked into the dataset. The reliable signal is the `media` global-document
 * reference (`media-library:LIBRARY_ID:...`); `source.name` is optional and only
 * a confirmation, so both are checked. Each check is guarded with `defined()` so
 * ordinary dataset-uploaded assets — which carry neither field — are kept.
 * See https://www.sanity.io/docs/content-lake/assets
 */
export const buildExcludeMediaLibraryFragment = (
  showMediaLibraryAssets: boolean,
): string | undefined =>
  showMediaLibraryAssets
    ? undefined
    : groq`(!defined(source.name) || source.name != "${MEDIA_LIBRARY_SOURCE_NAME}") && (!defined(media._ref) || !string::startsWith(media._ref, "${MEDIA_LIBRARY_REF_PREFIX}"))`

const constructFilter = ({
  assetTypes,
  currentFolderId,
  excludeTagSlugs,
  searchFacets,
  searchQuery,
  showMediaLibraryAssets = true,
}: {
  assetTypes: AssetType[]
  currentFolderId?: string | null
  excludeTagSlugs?: string[]
  searchFacets: SearchFacetInputProps[]
  searchQuery?: string
  /** When `false`, assets managed by the Sanity Media Library are excluded. Defaults to `true`. */
  showMediaLibraryAssets?: boolean
}): string => {
  // Fetch asset types depending on current context.
  // Either limit to a specific type (if being used as a custom asset source) or fetch both files and images (if being used as a tool)
  // Sanity will crash if you try and insert incompatible asset types into fields!
  const documentAssetTypes = assetTypes.map((type) => `sanity.${type}Asset`)

  const baseFilter = groq`
    _type in ${JSON.stringify(documentAssetTypes)} && !(_id in path("drafts.**"))
  `

  const excludeTagsFragment = buildExcludeTagsFragment(excludeTagSlugs)

  const excludeMediaLibraryFragment = buildExcludeMediaLibraryFragment(showMediaLibraryAssets)

  const searchFacetFragments = searchFacets.reduce((acc: string[], facet) => {
    if (facet.type === 'number') {
      const {field, modifier, modifiers, operatorType, value} = facet
      const operator = operators[operatorType]

      // Get current modifier
      const currentModifier = modifiers?.find((m) => m.name === modifier)

      // Apply field modifier function (if present)
      const facetField = currentModifier?.fieldModifier
        ? currentModifier.fieldModifier(field)
        : field

      const fragment = operator.fn(value, facetField)
      if (fragment) {
        acc.push(fragment)
      }
    }

    if (facet.type === 'searchable') {
      const {field, operatorType, value} = facet
      const operator = operators[operatorType]

      const fragment = operator.fn(value?.value, field)
      if (fragment) {
        acc.push(fragment)
      }
    }

    if (facet.type === 'select') {
      const {field, operatorType, options, value} = facet
      const operator = operators[operatorType]

      const currentOptionValue = options?.find((l) => l.name === value)?.value

      const fragment = operator.fn(currentOptionValue, field)
      if (fragment) {
        acc.push(fragment)
      }
    }

    if (facet.type === 'string') {
      const {field, operatorType, value} = facet
      const operator = operators[operatorType]

      const fragment = operator.fn(value, field)
      if (fragment) {
        acc.push(fragment)
      }
    }

    return acc
  }, [])

  // All assets (no folder selected) should not apply a folder filter. A specific
  // folder shows only assets pointing at it.
  const folderFilter: string | undefined = currentFolderId
    ? `opt.media.folder._ref == ${JSON.stringify(currentFolderId)}`
    : undefined

  // Join separate filter fragments
  const constructedQuery = [
    // Base filter
    baseFilter,
    ...(excludeMediaLibraryFragment ? [excludeMediaLibraryFragment] : []),
    ...(excludeTagsFragment ? [excludeTagsFragment] : []),
    // Search query (if present)
    // NOTE: Currently this only searches direct fields on sanity.fileAsset/sanity.imageAsset and NOT referenced tags
    // It's possible to add this by adding the following line to the searchQuery, but it's quite slow
    // references(*[_type == "media.tag" && name.current == "${searchQuery.trim()}"]._id)
    ...(searchQuery
      ? [
          groq`[_id, altText, assetId, creditLine, description, originalFilename, title, url] match '*${searchQuery.trim()}*'`,
        ]
      : []),
    ...(folderFilter ? [folderFilter] : []),
    // Search facets
    ...searchFacetFragments,
  ].join(' && ')

  return constructedQuery
}

export default constructFilter
