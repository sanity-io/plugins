import {useEffect, useRef} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import type {AssetSourceComponentProps} from 'sanity'

import {inputs} from '../../config/searchFacets'
import {assetsActions} from '../../modules/assets'
import {foldersActions} from '../../modules/folders'
import {searchActions} from '../../modules/search'
import {tagsActions} from '../../modules/tags'
import type {RootReducerState} from '../../modules/types'

function getMediaTagNames(schemaType?: AssetSourceComponentProps['schemaType']): string[] {
  const mediaTags = (schemaType?.options as {mediaTags?: string[]} | undefined)?.mediaTags
  if (!mediaTags?.length) return []
  const unique = new Set(
    mediaTags.map((t) => t?.trim()).filter((t): t is string => Boolean(t?.length)),
  )
  return Array.from(unique)
}

/**
 * Loads the browser's tags and folders, starts the listeners and applies the configured
 * `mediaTags` facets, once per browser: effects run again when an `<Activity>` boundary shows
 * the tool again, and repeating these would clear and refetch data the store already has.
 */
export function useBrowserInit(schemaType?: AssetSourceComponentProps['schemaType']): void {
  const dispatch = useDispatch()
  const tagsByIds = useSelector((state: RootReducerState) => state.tags.byIds)
  const tagsFetchCount = useSelector((state: RootReducerState) => state.tags.fetchCount)

  const tagNames = getMediaTagNames(schemaType)
  const hasMediaTags = tagNames.length > 0

  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (!hasMediaTags) {
      dispatch(searchActions.facetsClear())
    }

    dispatch(tagsActions.fetchRequest())
    dispatch(foldersActions.fetchRequest())

    dispatch(assetsActions.listenRequest())
    dispatch(tagsActions.listenRequest())
    dispatch(foldersActions.listenRequest())
  }, [dispatch, hasMediaTags])

  // When mediaTags are configured, apply them as facets once the tags have arrived
  // (`fetchCount` is -1 until the fetch completes). Dispatching clear + add synchronously
  // keeps all actions within assetsSearchEpic's 400ms debounce window, so the browser
  // performs exactly one asset fetch on open.
  const facetsApplied = useRef(false)
  useEffect(() => {
    if (!hasMediaTags || tagsFetchCount < 0 || facetsApplied.current) return
    facetsApplied.current = true

    const tagFacetInput = inputs.tag
    if (tagFacetInput.type !== 'searchable') return

    const resolvedTags = tagNames
      .map((name) => Object.values(tagsByIds).find((item) => item.tag.name.current === name))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))

    dispatch(searchActions.facetsClear())

    for (const tagItem of resolvedTags) {
      dispatch(
        searchActions.facetsAdd({
          facet: {
            ...tagFacetInput,
            operatorType: 'references',
            value: {label: tagItem.tag.name.current, value: tagItem.tag._id},
          },
        }),
      )
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [tagsFetchCount, hasMediaTags]) // eslint-disable-line react-hooks/exhaustive-deps
}
