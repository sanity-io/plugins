import {Box, Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {useMemo} from 'react'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import {selectHasMorePages, selectReplacementCandidateIds} from '../../machines/assetsMachine'
import type {CardAssetData} from '../../types'
import AssetGridVirtualized from '../AssetGridVirtualized'

/**
 * Lists the image assets that can replace the asset targeted by the replace dialog. While the
 * dialog is open the assets actor browses the whole library, and keeps loading pages until it
 * finds candidates.
 */
const ReplaceAssetsOverview = () => {
  const {assets} = useMediaActors()
  const candidateIds = useSelector(assets, selectReplacementCandidateIds)
  const hasFetchedOnce = useSelector(assets, (snapshot) => snapshot.context.fetchCount >= 0)
  const hasMorePages = useSelector(assets, selectHasMorePages)
  const loading = useSelector(assets, (snapshot) => !snapshot.matches({fetch: 'idle'}))

  const items = useMemo(
    () => candidateIds.map((id): CardAssetData => ({id, type: 'asset'})),
    [candidateIds],
  )

  const isEmpty = items.length === 0 && hasFetchedOnce && !loading && !hasMorePages

  const handleLoadMoreItems = () => {
    assets.send({type: 'load.more'})
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
            items={items}
            onLoadMore={handleLoadMoreItems}
            source="replace-asset"
          />
        </Box>
      )}
    </Box>
  )
}

export default ReplaceAssetsOverview
