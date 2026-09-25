import {Box, useMediaIndex} from '@sanity/ui'
import {useSelector} from '@xstate/react'

import {FOLDERS_PANEL_WIDTH} from '../../constants'
import {useMediaActors} from '../../contexts/MediaActorsContext'
import FolderView from '../FolderView'

const FolderPanel = () => {
  const {folders} = useMediaActors()
  const panelVisible = useSelector(folders, (snapshot) => snapshot.context.panelVisible)
  const mediaIndex = useMediaIndex()

  // Smaller breakpoints show folders in a dialog instead
  if (!panelVisible || mediaIndex <= 1) {
    return null
  }

  return (
    <Box
      style={{
        position: 'relative',
        width: FOLDERS_PANEL_WIDTH,
      }}
    >
      <Box
        className="media__custom-scrollbar"
        style={{
          borderRight: '1px solid var(--card-border-color)',
          height: '100%',
          left: 0,
          overflowX: 'hidden',
          overflowY: 'auto',
          position: 'absolute',
          top: 0,
          width: '100%',
        }}
      >
        <FolderView />
      </Box>
    </Box>
  )
}

export default FolderPanel
