import {Box, Text} from '@sanity/ui'
import {useEffect, useRef, useState} from 'react'
import {useDispatch, useStore} from 'react-redux'

import useTypedSelector from '../../hooks/useTypedSelector'
import {assetsActions} from '../../modules/assets'
import {foldersActions} from '../../modules/folders'
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
  const fetchingError = useTypedSelector((state) => state.assets.fetchingError)
  const pageSize = useTypedSelector((state) => state.assets.pageSize)
  const searchQuery = useTypedSelector((state) => state.search.query)
  const searchFacets = useTypedSelector((state) => state.search.facets)
  const currentFolderId = useTypedSelector((state) => state.folders.currentFolderId)
  const currentFolderUnfiled = useTypedSelector((state) => state.folders.currentFolderUnfiled)

  // Prefer the dialog's assetId — search refetch clears `allIds` / can drop picks.
  const assetToReplaceId = useTypedSelector((state) => {
    const dialog = state.dialog.items.find((item) => item.type === 'dialogAllAssets')
    return dialog?.type === 'dialogAllAssets' ? dialog.assetId : undefined
  })

  const savedBrowserStateRef = useRef<{
    assetId: string | undefined
    query: string
    facets: WithId<SearchFacetInputProps>[]
    folderId: string | null
    folderUnfiled: boolean
  } | null>(null)

  // Clearing the search only triggers a refetch after `assetsSearchEpic`'s debounce, so the
  // stale results stay in the store for a moment. Track that gap to avoid rendering the
  // empty state before the unscoped results arrive.
  const [awaitingRefetch, setAwaitingRefetch] = useState(
    () =>
      searchQuery.length > 0 ||
      searchFacets.length > 0 ||
      Boolean(currentFolderId) ||
      currentFolderUnfiled,
  )

  // Clear the browser search, facets and folder scope so the picker is not limited to the
  // result set the user used to find the asset. Restore them when the dialog closes.
  useEffect(() => {
    const {dialog, folders, search} = store.getState()
    const {query, facets} = search
    const dialogItem = dialog.items.find((item) => item.type === 'dialogAllAssets')

    savedBrowserStateRef.current = {
      assetId: dialogItem?.type === 'dialogAllAssets' ? dialogItem.assetId : undefined,
      query,
      facets,
      folderId: folders.currentFolderId,
      folderUnfiled: folders.currentFolderUnfiled,
    }

    if (query.length > 0) {
      dispatch(searchActions.querySet({searchQuery: ''}))
    }
    if (facets.length > 0) {
      dispatch(searchActions.facetsClear())
    }
    if (folders.currentFolderId || folders.currentFolderUnfiled) {
      dispatch(foldersActions.currentFolderClear())
    }

    return () => {
      const saved = savedBrowserStateRef.current
      if (!saved) {
        return
      }

      const hadScope =
        saved.query.length > 0 ||
        saved.facets.length > 0 ||
        Boolean(saved.folderId) ||
        saved.folderUnfiled

      if (saved.query.length > 0) {
        dispatch(searchActions.querySet({searchQuery: saved.query}))
      }
      for (const facet of saved.facets) {
        dispatch(searchActions.facetsAdd({facet: omitFacetId(facet)}))
      }
      if (saved.folderId) {
        dispatch(foldersActions.currentFolderSet({folderId: saved.folderId}))
      } else if (saved.folderUnfiled) {
        dispatch(foldersActions.currentFolderShowUnfiled())
      }

      // Changing the search or folder runs epics that clear picks — put the asset being
      // replaced back so closing the dialog keeps the browser selection.
      if (hadScope && saved.assetId) {
        dispatch(assetsActions.pick({assetId: saved.assetId, picked: true}))
      }
    }
  }, [dispatch, store])

  // Every rescoped refetch is preceded by `assetsActions.clear()`, so wait for the asset
  // list to be emptied and the following fetch to settle. Watching `fetching` alone is not
  // enough: `assetsFetchEpic` uses `switchMap`, so replacing an in-flight request leaves
  // `fetching` true throughout. Clearing a folder scope and a search at the same time
  // produces two refetches (the folder one immediately, the search one after its debounce),
  // so each list clear re-arms the wait rather than resolving it for good.
  useEffect(() => {
    let previousIds = store.getState().assets.allIds
    let awaitingSettle = false

    return store.subscribe(() => {
      const {allIds, fetching: isFetching} = store.getState().assets
      const listCleared = allIds !== previousIds && allIds.length === 0
      previousIds = allIds

      if (listCleared) {
        awaitingSettle = true
        setAwaitingRefetch(true)
        return
      }
      if (awaitingSettle && !isFetching) {
        awaitingSettle = false
        setAwaitingRefetch(false)
      }
    })
  }, [store])

  const scopeActive =
    searchQuery.length > 0 ||
    searchFacets.length > 0 ||
    Boolean(currentFolderId) ||
    currentFolderUnfiled

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
  // Don't treat a scoped / stale / mid-fetch / incomplete page as "no replacements".
  const isEmpty =
    reducedItems.length === 0 &&
    hasFetchedOnce &&
    !fetching &&
    !scopeActive &&
    !awaitingRefetch &&
    !hasMorePages

  // Keep loading pages until we find image candidates or exhaust results. A failed fetch
  // leaves `fetchCount` untouched, so stop paging on error instead of retrying forever.
  useEffect(() => {
    if (
      scopeActive ||
      fetching ||
      awaitingRefetch ||
      fetchingError ||
      reducedItems.length > 0 ||
      !hasFetchedOnce ||
      !hasMorePages
    ) {
      return
    }
    dispatch(assetsActions.loadNextPage())
  }, [
    dispatch,
    scopeActive,
    fetching,
    awaitingRefetch,
    fetchingError,
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
