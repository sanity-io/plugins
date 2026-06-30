import {Box} from '@sanity/ui'
import {memo} from 'react'
import {type GroupContent, type GroupItemContent, GroupedVirtuoso} from 'react-virtuoso'

import useTypedSelector from '../../hooks/useTypedSelector'
import type {CardAssetData, CardUploadData} from '../../types'
import TableHeader from '../TableHeader'
import TableRowAsset from '../TableRowAsset'
import TableRowUpload from '../TableRowUpload'

type Props = {
  items: (CardAssetData | CardUploadData)[]
  onLoadMore?: () => void
}

// `GroupedVirtuoso` has no `data` prop, so the per-render rows and selection are
// passed through `context` to keep the render callbacks at module scope.
type TableContext = {items: (CardAssetData | CardUploadData)[]; selectedIds: string[]}

const VirtualRow = memo(
  ({item, selected}: {item: CardAssetData | CardUploadData; selected: boolean}) => {
    if (item?.type === 'asset') {
      return (
        <Box style={{height: '100px'}}>
          <TableRowAsset id={item.id} selected={selected} />
        </Box>
      )
    }

    if (item?.type === 'upload') {
      return (
        <Box style={{height: '100px'}}>
          <TableRowUpload id={item.id} />
        </Box>
      )
    }

    return null
  },
)

const renderGroupHeader: GroupContent<TableContext> = () => <TableHeader />

const renderRow: GroupItemContent<unknown, TableContext> = (index, _groupIndex, _data, context) => {
  const item = context.items[index]
  return <VirtualRow item={item!} selected={context.selectedIds.includes(item?.id || '')} />
}

const AssetTableVirtualized = (props: Props) => {
  const {items, onLoadMore} = props

  // Redux
  const selectedAssets = useTypedSelector((state) => state.selected.assets)

  const selectedIds = (selectedAssets && selectedAssets.map((asset) => asset._id)) || []
  const totalCount = items?.length

  if (totalCount === 0) {
    return null
  }

  return (
    <GroupedVirtuoso
      className="media__custom-scrollbar"
      computeItemKey={(index) => {
        const item = items[index]
        return item?.id || index
      }}
      context={{items, selectedIds}}
      endReached={onLoadMore}
      groupCounts={Array(1).fill(totalCount)}
      groupContent={renderGroupHeader}
      itemContent={renderRow}
      style={{overflowX: 'hidden'}}
    />
  )
}

export default AssetTableVirtualized
