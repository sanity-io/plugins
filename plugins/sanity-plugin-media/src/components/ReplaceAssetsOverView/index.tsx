import {Box, Text} from '@sanity/ui'
import {useEffect, useRef, useState} from 'react'
import {useDispatch, useStore} from 'react-redux'

import useTypedSelector from '../../hooks/useTypedSelector'
import {assetsActions} from '../../modules/assets'
import {searchActions} from '../../modules/search'
import {selectCombinedItems} from '../../modules/selectors'
import type {RootReducerState} from '../../modules/types'
import type {SearchFacetInputProps, WithId} from '../../types'
import {isImageAsset} from '../../utils/typeGuards'
import AssetGridVirtualized from '../AssetGridVirtualized'

function omitFacetId(facet: WithId<SearchFacetInputProps>): SearchFacetInputProps {
  // Strip the runtime `id` so facetsAdd can assign a fresh one on restore.
  const {id: _id, ...withoutId} = facet
  void _id
  return withoutId
}

const ReplaceAssetsOverview = () => {
  const dispatch = useDispatch()
  const store = useStore<RootReducerState>()
  const combinedItems = useTypedSelector(selectCombinedItems)
  const assetsById = useTypedSelector((state) => state.assets.byIds)
  const fetchCount = useTypedSelector((state) => state.assets.fetchCount)
  const fetching = useTypedSelector((state) => state.assets.fetching)
  const pageSize = useTypedSelector((state) => state.assets.pageSize)
  const searchQuery = useTypedSelector((state) => state.search.query)
  const searchFacets = useTypedSelector((state) => state.search.facets)

  // Prefer the dialog's assetId — search refetch clears `allIds` / can drop picks.
  const assetToReplaceId = useTypedSelector((state) => {
    const dialog = state.dialog.items.find((item) => item.type === 'dialogAllAssets')
    return dialog?.type === 'dialogAllAssets' ? dialog.assetId : undefined
  })

  const savedSearchRef = useRef<{
    query: string
    facets: WithId<SearchFacetInputProps>[]
  } | null>(null)

  // Clearing filters only triggers a refetch after `assetsSearchEpic`'s debounce, so the
  // stale filtered results stay in the store for a moment. Track that gap to avoid
  // rendering the empty state before the unfiltered results arrive.
  const [awaitingRefetch, setAwaitingRefetch] = useState(
    () => searchQuery.length > 0 || searchFacets.length > 0,
  )

  // Clear browser search/facets so the picker is not limited to the filtered result set
  // the user used to find the asset. Restore them when the dialog closes.
  useEffect(() => {
    const {query, facets} = store.getState().search
    savedSearchRef.current = {query, facets}

    if (query.length > 0) {
      dispatch(searchActions.querySet({searchQuery: ''}))
    }
    if (facets.length > 0) {
      dispatch(searchActions.facetsClear())
    }

    return () => {
      const saved = savedSearchRef.current
      if (!saved) {
        return
      }
      if (saved.query.length > 0) {
        dispatch(searchActions.querySet({searchQuery: saved.query}))
      }
      if (saved.facets.length > 0) {
        for (const facet of saved.facets) {
          dispatch(searchActions.facetsAdd({facet: omitFacetId(facet)}))
        }
      }
    }
  }, [dispatch, store])

  // Resolve the wait once a fetch started after the filters were cleared has completed.
  useEffect(() => {
    if (!awaitingRefetch) {
      return undefined
    }

    // A fetch already running when the dialog opened belongs to the filtered query.
    let staleFetchInFlight = store.getState().assets.fetching
    let refetchStarted = false

    return store.subscribe(() => {
      const {fetching: isFetching} = store.getState().assets

      if (isFetching) {
        refetchStarted = !staleFetchInFlight
        return
      }
      if (staleFetchInFlight) {
        staleFetchInFlight = false
        return
      }
      if (refetchStarted) {
        setAwaitingRefetch(false)
      }
    })
  }, [awaitingRefetch, store])

  const filtersActive = searchQuery.length > 0 || searchFacets.length > 0

  // Only image assets can replace image refs; exclude uploads and the asset being replaced.
  const reducedItems = combinedItems.filter((item) => {
    if (item.type !== 'asset' || item.id === assetToReplaceId) {
      return false
    }
    const asset = assetsById[item.id]?.asset
    return asset ? isImageAsset(asset) : false
  })

  const hasFetchedOnce = fetchCount >= 0
  const hasMorePages = fetchCount === pageSize
  // Don't treat a filtered / stale / mid-fetch / incomplete page as "no replacements".
  const isEmpty =
    reducedItems.length === 0 &&
    hasFetchedOnce &&
    !fetching &&
    !filtersActive &&
    !awaitingRefetch &&
    !hasMorePages

  // Keep loading pages until we find image candidates or exhaust results.
  useEffect(() => {
    if (
      filtersActive ||
      fetching ||
      awaitingRefetch ||
      reducedItems.length > 0 ||
      !hasFetchedOnce ||
      !hasMorePages
    ) {
      return
    }
    dispatch(assetsActions.loadNextPage())
  }, [
    dispatch,
    filtersActive,
    fetching,
    awaitingRefetch,
    reducedItems.length,
    hasFetchedOnce,
    hasMorePages,
  ])

  const handleLoadMoreItems = () => {
    if (!fetching) {
      dispatch(assetsActions.loadNextPage())
    }
  }

  return (
    <Box height="fill">
      {isEmpty ? (
        <Box padding={5}>
          <Text size={1} weight="semibold">
            There are no replacement images
          </Text>
        </Box>
      ) : (
        <Box height="fill">
          <AssetGridVirtualized
            items={reducedItems}
            onLoadMore={handleLoadMoreItems}
            source="replace-asset"
          />
        </Box>
      )}
    </Box>
  )
}

export default ReplaceAssetsOverview
