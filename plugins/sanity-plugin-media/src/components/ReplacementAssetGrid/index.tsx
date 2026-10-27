import {Box, Card, Flex, Text} from '@sanity/ui'
import type {ComponentPropsWithRef} from 'react'
import {VirtuosoGrid} from 'react-virtuoso'
import {useColorSchemeValue} from 'sanity'

import type {ImageAsset} from '../../types'
import imageDprUrl from '../../utils/imageDprUrl'
import Image from '../Image'

type Props = {
  items: ImageAsset[]
  onLoadMore: () => void
  onSelect: (asset: ImageAsset) => void
}

const CARD_HEIGHT = 220
const CARD_WIDTH = 240

type VirtuosoSlotProps = ComponentPropsWithRef<'div'> & {context?: unknown}

const GridList = ({context, style, ...rest}: VirtuosoSlotProps) => {
  // `context` is a Virtuoso prop, not a DOM attribute.
  void context
  return (
    <div
      {...rest}
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, ${CARD_WIDTH}px)`,
        justifyContent: 'center',
      }}
    />
  )
}

const GridItem = ({context, style, ...rest}: VirtuosoSlotProps) => {
  void context
  return <div {...rest} style={{...style, height: CARD_HEIGHT, width: CARD_WIDTH}} />
}

const ReplacementCard = ({asset, onSelect}: {asset: ImageAsset; onSelect: Props['onSelect']}) => {
  const scheme = useColorSchemeValue()
  const filename = asset.originalFilename ?? asset._id

  return (
    <Box padding={1} style={{height: '100%'}}>
      <Card
        __unstable_focusRing
        as="button"
        border
        data-testid={`media-replacement-card-${asset._id}`}
        onClick={() => onSelect(asset)}
        padding={1}
        radius={2}
        style={{cursor: 'pointer', height: '100%', width: '100%'}}
        title={filename}
      >
        <Flex direction="column" gap={2} style={{height: '100%'}}>
          <Box flex={1} style={{minHeight: 0}}>
            <Image
              alt=""
              draggable={false}
              $scheme={scheme}
              $showCheckerboard={!asset.metadata?.isOpaque}
              src={imageDprUrl(asset, {height: 250, width: 250})}
            />
          </Box>
          <Box paddingX={1} paddingBottom={1}>
            <Text muted size={0} textOverflow="ellipsis">
              {filename}
            </Text>
          </Box>
        </Flex>
      </Card>
    </Box>
  )
}

const ReplacementAssetGrid = ({items, onLoadMore, onSelect}: Props) => (
  <VirtuosoGrid
    className="media__custom-scrollbar"
    components={{Item: GridItem, List: GridList}}
    computeItemKey={(index) => items[index]?._id ?? index}
    endReached={onLoadMore}
    itemContent={(index) => {
      const asset = items[index]
      return asset ? <ReplacementCard asset={asset} onSelect={onSelect} /> : null
    }}
    overscan={48}
    style={{height: '100%', overflowAnchor: 'none', overflowX: 'hidden', overflowY: 'scroll'}}
    totalCount={items.length}
  />
)

export default ReplacementAssetGrid
