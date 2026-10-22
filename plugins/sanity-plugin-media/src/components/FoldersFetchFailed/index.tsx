import {Button, Flex, Text} from '@sanity/ui'

import {useMediaActors} from '../../contexts/MediaActorsContext'

/** Stands in for the folder list when folders failed to load, and loads them again on request. */
const FoldersFetchFailed = () => {
  const {folders} = useMediaActors()

  return (
    <Flex align="center" gap={2} wrap="wrap">
      <Text muted size={1}>
        Unable to load folders
      </Text>
      <Button
        fontSize={1}
        mode="ghost"
        onClick={() => folders.send({type: 'fetch'})}
        padding={2}
        text="Retry"
      />
    </Flex>
  )
}

export default FoldersFetchFailed
