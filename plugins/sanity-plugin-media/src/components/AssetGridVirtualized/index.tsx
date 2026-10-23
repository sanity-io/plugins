import {memo} from 'react'
import {VirtuosoGrid} from 'react-virtuoso'

import useTypedSelector from '../../hooks/useTypedSelector'
import type {CardAssetData, CardFolderData, CardUploadData} from '../../types'
import CardAsset from '../CardAsset'
import CardFolder from '../CardFolder'
import CardUpload from '../CardUpload'

import * as styles from './AssetGridVirtualized.module.css'

type Props = {
  items: (CardAssetData | CardFolderData | CardUploadData)[]
  onLoadMore?: () => void
  source?: string
}

const VirtualCell = memo(
  ({
    item,
    selected,
    source,
  }: {
    item: CardAssetData | CardFolderData | CardUploadData
    selected: boolean
    source?: string
  }) => {
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

const ItemContainer = (props: any) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we're doing this to avoid warnings about `context` passed as an attribute
  const {className, context, ref, ...rest} = props
  return (
    <div
      className={[styles.itemContainer, className].filter(Boolean).join(' ')}
      ref={ref}
      {...rest}
    />
  )
}

const ListContainer = (props: any) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we're doing this to avoid warnings about `context` passed as an attribute
  const {className, context, ref, ...rest} = props
  return (
    <div
      className={[styles.listContainer, className].filter(Boolean).join(' ')}
      ref={ref}
      {...rest}
    />
  )
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
      endReached={onLoadMore}
      itemContent={(index) => {
        const item = items[index]!
        const selected = selectedIds.includes(item.id)
        return <VirtualCell item={item} selected={selected} source={source} />
      }}
      overscan={48}
      // VirtuosoGrid, unlike Virtuoso's lists and tables, doesn't opt out of browser scroll
      // anchoring, which fights its own positioning and can make the grid jump after scrolling
      style={{overflowAnchor: 'none', overflowX: 'hidden', overflowY: 'scroll'}}
      totalCount={totalCount}
    />
  )
}

export default AssetGridVirtualized
