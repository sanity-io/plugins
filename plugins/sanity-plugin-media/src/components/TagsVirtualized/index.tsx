import {Flex, Label} from '@sanity/ui'
import {memo, useState} from 'react'
import {type ItemContent, Virtuoso} from 'react-virtuoso'

import {PANEL_HEIGHT} from '../../constants'
import useTypedSelector from '../../hooks/useTypedSelector'
import {selectAssetsPicked} from '../../modules/assets'
import {selectTags} from '../../modules/tags'
import type {TagActions, TagItem} from '../../types'
import Tag from '../Tag'

type TagListItem = string | (TagItem & {actions: TagActions[]})

const VirtualRow = memo(({isScrolling, item}: {isScrolling?: boolean; item: TagListItem}) => {
  // Render label
  if (typeof item === 'string') {
    return (
      <Flex
        align="center"
        justify="space-between"
        key={item}
        paddingX={3}
        style={{height: `${PANEL_HEIGHT}px`}}
      >
        <Label size={0}>{item}</Label>
      </Flex>
    )
  }

  // Render tag - only display actions if we're not in the process of scrolling
  return <Tag actions={isScrolling ? undefined : item.actions} key={item.tag?._id} tag={item} />
})

// Kept at module scope (not defined during render) so it isn't treated as an
// unstable nested component; the per-render `isScrolling` flag is passed via context.
const renderTagRow: ItemContent<TagListItem, boolean> = (_index, item, isScrolling) => (
  <VirtualRow isScrolling={isScrolling} item={item} />
)

const TagsVirtualized = () => {
  const assetsPicked = useTypedSelector(selectAssetsPicked)
  const tags = useTypedSelector(selectTags)

  // State
  const [isScrolling, setIsScrolling] = useState(false)

  // TODO: refactor, there's most certainly a more performant way to do this

  // Filter out all tag IDS used (across all) and dedupe
  const pickedTagIds = assetsPicked?.reduce((acc: string[], val) => {
    const assetTagIds = val?.asset?.opt?.media?.tags?.map((tag) => tag._ref) || []
    acc = acc.concat(assetTagIds)
    return acc
  }, [])
  const pickedTagIdsUnique = [...new Set(pickedTagIds)]

  // Segment tags into two buckets:
  // 1. those which exist in all picked assets ('applied to all')
  // 2. those which exist in some picked assets ('applied to some')
  const tagIdsSegmented = pickedTagIdsUnique.reduce(
    (acc: {appliedToAll: string[]; appliedToSome: string[]}, tagId) => {
      const tagIsInEveryAsset = assetsPicked.every((assetItem) => {
        const tagIndex =
          assetItem.asset.opt?.media?.tags?.findIndex((tag) => tag._ref === tagId) ?? -1
        return tagIndex >= 0
      })

      if (tagIsInEveryAsset) {
        acc.appliedToAll.push(tagId)
      } else {
        acc.appliedToSome.push(tagId)
      }

      return acc
    },
    {
      appliedToAll: [],
      appliedToSome: [],
    },
  )

  const tagsAppliedToAll = tags
    .filter((tag) => tagIdsSegmented.appliedToAll.includes(tag.tag._id))
    .map((tagItem) => ({
      ...tagItem,
      actions: ['delete', 'edit', 'removeAll', 'search'] as TagActions[],
    }))
  const tagsAppliedToSome = tags
    .filter((tag) => tagIdsSegmented.appliedToSome.includes(tag.tag._id))
    .map((tagItem) => ({
      ...tagItem,
      actions: ['applyAll', 'delete', 'edit', 'removeAll', 'search'] as TagActions[],
    }))
  const tagsUnused = tags
    .filter((tag) => !pickedTagIdsUnique.includes(tag.tag._id))
    .map((tagItem) => ({
      ...tagItem,
      actions: ['applyAll', 'delete', 'edit', 'search'] as TagActions[],
    }))

  let items: TagListItem[] = []
  if (assetsPicked.length === 0) {
    items = tags.map((tagItem) => ({
      ...tagItem,
      actions: ['delete', 'edit', 'search'] as TagActions[],
    }))
  } else {
    if (tagsAppliedToAll?.length > 0) {
      items = [
        ...items, //
        assetsPicked.length === 1 ? 'Used' : 'Used by all',
        ...tagsAppliedToAll,
      ]
    }
    if (tagsAppliedToSome?.length > 0) {
      items = [
        ...items, //
        'Used by some',
        ...tagsAppliedToSome,
      ]
    }
    if (tagsUnused?.length > 0) {
      items = [
        ...items, //
        'Unused',
        ...tagsUnused,
      ]
    }
  }

  return (
    <Virtuoso
      className="media__custom-scrollbar"
      computeItemKey={(index) => {
        const item = items[index]
        if (typeof item === 'string') {
          return item
        }
        return item!.tag._id
      }}
      context={isScrolling}
      data={items}
      isScrolling={setIsScrolling}
      itemContent={renderTagRow}
      style={{flex: 1, overflowX: 'hidden'}}
    />
  )
}

export default TagsVirtualized
