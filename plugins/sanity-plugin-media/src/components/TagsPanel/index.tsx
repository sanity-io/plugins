import {Box, useMediaIndex} from '@sanity/ui'
import {useSelector} from '@xstate/react'

import {TAGS_PANEL_WIDTH} from '../../constants'
import {useMediaActors} from '../../contexts/MediaActorsContext'
import TagView from '../TagView'

const TagsPanel = () => {
  const {tags} = useMediaActors()
  const panelVisible = useSelector(tags, (snapshot) => snapshot.context.panelVisible)
  const mediaIndex = useMediaIndex()

  // Smaller breakpoints show tags in a dialog instead
  if (!panelVisible || mediaIndex <= 1) {
    return null
  }

  return (
    <Box
      style={{
        position: 'relative',
        width: TAGS_PANEL_WIDTH,
      }}
    >
      <Box
        className="media__custom-scrollbar"
        style={{
          borderLeft: '1px solid var(--card-border-color)',
          height: '100%',
          overflowX: 'hidden',
          overflowY: 'auto',
          position: 'absolute',
          right: 0,
          top: 0,
          width: '100%',
        }}
      >
        <TagView />
      </Box>
    </Box>
  )
}

export default TagsPanel
