import groq from 'groq'

import {operators} from '../config/searchFacets'
import {MEDIA_LIBRARY_REF_PREFIX, MEDIA_LIBRARY_SOURCE_NAME, TAG_DOCUMENT_NAME} from '../constants'
import type {AssetType, SearchFacetInputProps, SearchFacetOperatorType} from '../types'

/**
 * Asset fields stored as a plain string, or as `{[localeId]: string}` when the
 * plugin `locales` option is set.
 */
const LOCALIZED_TEXT_FIELDS = new Set(['altText', 'creditLine', 'description', 'title'])

const TEXT_SEARCH_FIELDS = [
  '_id',
  'altText',
  'assetId',
  'creditLine',
  'description',
  'originalFilename',
  'title',
  'url',
] as const

/** Quote a locale id for GROQ bracket access (`altText["zh-CN"]`). Dot access treats `-` as subtraction. */
const groqString = (value: string): string => JSON.stringify(value)

const localizedFieldPaths = (field: string, localeIds?: string[]): string[] => {
  if (!localeIds?.length || !LOCALIZED_TEXT_FIELDS.has(field)) return []

  const seen = new Set<string>()
  const paths: string[] = []
  for (const localeId of localeIds) {
    if (!localeId || seen.has(localeId)) continue
    seen.add(localeId)
    paths.push(`${field}[${groqString(localeId)}]`)
  }
  return paths
}

/**
 * Fields the main search box matches. Locale paths are added beside the bare
 * field so both `{en: "…"}` values and not-yet-migrated plain strings match.
 * `match` does not look inside objects, so the bare field alone never hits a
 * localized value.
 */
const textSearchFieldList = (localeIds?: string[]): string =>
  TEXT_SEARCH_FIELDS.flatMap((field) => [field, ...localizedFieldPaths(field, localeIds)]).join(
    ', ',
  )

/**
 * True when a localized field has a value under the same rules as `defined()`:
 * a legacy string (including `""`), or any configured locale key that is set.
 */
const localizedFieldPresent = (field: string, paths: string[]): string => {
  const localeDefined = paths.map((path) => `defined(${path})`).join(' || ')
  return `((string(${field}) == ${field} && defined(${field})) || ${localeDefined})`
}

const stringFacetFragment = (
  field: string,
  operatorType: SearchFacetOperatorType,
  value: string | undefined,
  localeIds?: string[],
): string | undefined => {
  const paths = localizedFieldPaths(field, localeIds)
  if (paths.length === 0) {
    return operators[operatorType].fn(value, field)
  }

  if (operatorType === 'includes' || operatorType === 'doesNotInclude') {
    return operators[operatorType].fn(value, `[${field}, ${paths.join(', ')}]`)
  }

  if (operatorType === 'empty' || operatorType === 'notEmpty') {
    const present = localizedFieldPresent(field, paths)
    return operatorType === 'empty' ? `!(${present})` : present
  }

  return operators[operatorType].fn(value, field)
}

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
  localeIds,
  searchFacets,
  searchQuery,
  showMediaLibraryAssets = true,
}: {
  assetTypes: AssetType[]
  currentFolderId?: string | null
  excludeTagSlugs?: string[]
  /**
   * Configured plugin locale ids. When set, alt text, title, description, and
   * credit line are matched on each `field[localeId]` as well as the bare field.
   */
  localeIds?: string[]
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
      const fragment = stringFacetFragment(field, operatorType, value, localeIds)
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
      ? [groq`[${textSearchFieldList(localeIds)}] match '*${searchQuery.trim()}*'`]
      : []),
    ...(folderFilter ? [folderFilter] : []),
    // Search facets
    ...searchFacetFragments,
  ].join(' && ')

  return constructedQuery
}

export default constructFilter
