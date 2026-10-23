import {Box, Flex, Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import {useToolOptions} from '../../contexts/ToolOptionsContext'
import {selectPickedAssets} from '../../machines/assetsMachine'
import {selectIsFetchingTags, selectTags} from '../../machines/tagsMachine'
import TagsVirtualized from '../TagsVirtualized'
import TagViewHeader from '../TagViewHeader'

const TagView = () => {
  const {assets, tags: tagsActor} = useMediaActors()
  const numPickedAssets = useSelector(assets, (snapshot) => selectPickedAssets(snapshot).length)
  const {excludeTagSlugs} = useToolOptions()
  const tagsAll = useSelector(tagsActor, selectTags)
  const tags =
    excludeTagSlugs.length > 0
      ? tagsAll.filter((t) => !excludeTagSlugs.includes(t.tag.name.current))
      : tagsAll
  const fetching = useSelector(tagsActor, selectIsFetchingTags)
  const fetchCount = useSelector(tagsActor, (snapshot) => snapshot.context.fetchCount)
  const fetchComplete = fetchCount !== -1
  const hasTags = !fetching && tags?.length > 0
  const hasPicked = !!(numPickedAssets > 0)

  return (
    <Flex direction="column" flex={1} height="fill">
      <TagViewHeader
        allowCreate
        light={hasPicked}
        title={hasPicked ? 'Tags (in selection)' : 'Tags'}
      />

      {fetchComplete && !hasTags && (
        <Box padding={3}>
          <Text muted size={1}>
            <em>No tags</em>
          </Text>
        </Box>
      )}

      {hasTags && <TagsVirtualized tags={tags} />}
    </Flex>
  )
}

export default TagView
