import {memo} from 'react'
import {type GridItemContent, VirtuosoGrid} from 'react-virtuoso'
import {styled} from 'styled-components'

import useTypedSelector from '../../hooks/useTypedSelector'
import type {CardAssetData, CardFolderData, CardUploadData} from '../../types'
import CardAsset from '../CardAsset'
import CardFolder from '../CardFolder'
import CardUpload from '../CardUpload'

type Props = {
  items: (CardAssetData | CardFolderData | CardUploadData)[]
  onLoadMore?: () => void
  source?: string
}

type GridItem = CardAssetData | CardFolderData | CardUploadData
type GridContext = {selectedIds: string[]; source?: string}

const CARD_HEIGHT = 220
const CARD_WIDTH = 240

const VirtualCell = memo(
  ({item, selected, source}: {item: GridItem; selected: boolean; source?: string}) => {
    if (item?.type === 'asset') {
      return <CardAsset id={item.id} selected={selected} source={source} />
    }

    if (item?.type === 'folder') {
      return <CardFolder folderId={item.folderId} name={item.name} totalCount={item.totalCount} />
    }

    if (item?.type === 'upload') {
      return <CardUpload id={item.id} />
    }

    return null
  },
)

// Kept at module scope (not defined during render) so it isn't treated as an
// unstable nested component; per-render `selectedIds`/`source` are passed via context.
const renderCell: GridItemContent<GridItem, GridContext> = (_index, item, context) => (
  <VirtualCell
    item={item}
    selected={context.selectedIds.includes(item.id)}
    source={context.source}
  />
)

const StyledItemContainer = styled.div`
  height: ${CARD_HEIGHT}px;
  width: ${CARD_WIDTH}px;
`

const ItemContainer = (props: any) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we're doing this to avoid sc warnings about `context` passed as an attribute
  const {context, ref, ...rest} = props
  return <StyledItemContainer ref={ref} {...rest} />
}

const StyledListContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, ${CARD_WIDTH}px);
  grid-template-rows: repeat(auto-fill, ${CARD_HEIGHT}px);
  justify-content: center;
  margin: 0 auto;
`

const ListContainer = (props: any) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we're doing this to avoid sc warnings about `context` passed as an attribute
  const {context, ref, ...rest} = props
  return <StyledListContainer ref={ref} {...rest} />
}

const AssetGridVirtualized = (props: Props) => {
  const {items, onLoadMore, source} = props

  // Redux
  const selectedAssets = useTypedSelector((state) => state.selected.assets)

  const selectedIds = (selectedAssets && selectedAssets.map((asset) => asset._id)) || []
  const totalCount = items?.length

  if (totalCount === 0) {
    return null
  }

  return (
    <VirtuosoGrid
      className="media__custom-scrollbar"
      computeItemKey={(index) => {
        const item = items[index]
        return item?.id ?? index
      }}
      components={{
        Item: ItemContainer,
        List: ListContainer,
      }}
      context={{selectedIds, source}}
      data={items}
      endReached={onLoadMore}
      itemContent={renderCell}
      overscan={48}
      style={{overflowX: 'hidden', overflowY: 'scroll'}}
    />
  )
}

export default AssetGridVirtualized
