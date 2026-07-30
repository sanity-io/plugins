import {Box, Text} from '@sanity/ui'
import {useDispatch} from 'react-redux'

import useTypedSelector from '../../hooks/useTypedSelector'
import {assetsActions, selectAssetsPicked} from '../../modules/assets'
import {selectCombinedItems} from '../../modules/selectors'
import {isImageAsset} from '../../utils/typeGuards'
import AssetGridVirtualized from '../AssetGridVirtualized'

const ReplaceAssetsOverview = () => {
  const dispatch = useDispatch()
  const combinedItems = useTypedSelector(selectCombinedItems)
  const assetsById = useTypedSelector((state) => state.assets.byIds)
  const assetsPicked = useTypedSelector(selectAssetsPicked)
  const fetchCount = useTypedSelector((state) => state.assets.fetchCount)
  const fetching = useTypedSelector((state) => state.assets.fetching)

  // Prefer the currently picked asset over `lastPicked`, which is cleared when
  // unpicking even if another asset remains selected.
  const assetToReplaceId = assetsPicked.length === 1 ? assetsPicked[0]?.asset._id : undefined

  // Only image assets can replace image refs; exclude uploads and the asset being replaced.
  const reducedItems = combinedItems.filter((item) => {
    if (item.type !== 'asset' || item.id === assetToReplaceId) {
      return false
    }
    const asset = assetsById[item.id]?.asset
    return asset ? isImageAsset(asset) : false
  })

  const hasFetchedOnce = fetchCount >= 0
  const isEmpty = reducedItems.length === 0 && hasFetchedOnce && !fetching

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
            There are no assets
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
