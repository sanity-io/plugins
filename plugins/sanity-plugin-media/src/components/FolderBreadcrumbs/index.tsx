import {Box, Button, Inline, Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import {selectFolderAncestry} from '../../machines/foldersMachine'

const FolderBreadcrumbs = () => {
  const {assets, folders} = useMediaActors()
  const currentFolderId = useSelector(assets, (snapshot) => snapshot.context.currentFolderId)
  const segments = useSelector(folders, (snapshot) =>
    selectFolderAncestry(snapshot, currentFolderId),
  )

  if (!currentFolderId) {
    return null
  }

  return (
    <Box display={['block', 'block', 'none']} padding={2}>
      <Inline gap={1}>
        <Button
          fontSize={1}
          padding={2}
          mode="bleed"
          onClick={() => assets.send({type: 'folder.open', folderId: null})}
          text="All assets"
        />

        {segments.map((segment) => (
          <Inline key={segment.id} gap={1}>
            <Text muted size={1}>
              /
            </Text>
            <Button
              fontSize={1}
              padding={2}
              mode={currentFolderId === segment.id ? 'default' : 'bleed'}
              onClick={() => assets.send({type: 'folder.open', folderId: segment.id})}
              text={segment.name}
            />
          </Inline>
        ))}
      </Inline>
    </Box>
  )
}

export default FolderBreadcrumbs
