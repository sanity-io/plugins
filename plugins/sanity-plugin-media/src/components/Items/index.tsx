import {Box, Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import {useBrowserItems} from '../../hooks/useBrowserItems'
import {selectIsFetching} from '../../machines/assetsMachine'
import AssetGridVirtualized from '../AssetGridVirtualized'
import AssetTableVirtualized from '../AssetTableVirtualized'

const Items = () => {
  const {assets} = useMediaActors()
  const fetchCount = useSelector(assets, (snapshot) => snapshot.context.fetchCount)
  const fetching = useSelector(assets, selectIsFetching)
  const view = useSelector(assets, (snapshot) => snapshot.context.view)
  const items = useBrowserItems()

  const hasFetchedOnce = fetchCount >= 0
  const isEmpty = items.length === 0 && hasFetchedOnce && !fetching

  // Only loads another page when idle and the last page was full
  const handleLoadMoreItems = () => {
    assets.send({type: 'load.more'})
  }

  return (
    <Box flex={1} style={{width: '100%'}}>
      {isEmpty ? (
        <Box padding={4}>
          <Text size={1} weight="semibold">
            No results for the current query
          </Text>
        </Box>
      ) : (
        <>
          {view === 'grid' && (
            <AssetGridVirtualized items={items} onLoadMore={handleLoadMoreItems} />
          )}

          {view === 'table' && (
            <AssetTableVirtualized items={items} onLoadMore={handleLoadMoreItems} />
          )}
        </>
      )}
    </Box>
  )
}

export default Items
