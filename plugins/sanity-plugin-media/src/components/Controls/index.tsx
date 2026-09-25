import {FolderIcon} from '@sanity/icons/Folder'
import {Box, Button, Flex, Inline, useMediaIndex} from '@sanity/ui'
import {useSelector} from '@xstate/react'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import {selectIsFetching} from '../../machines/assetsMachine'
import {foldersDialog, searchFacetsDialog, tagsDialog} from '../../machines/dialogs'
import ButtonViewGroup from '../ButtonViewGroup'
import OrderSelect from '../OrderSelect'
import Progress from '../Progress'
import SearchFacets from '../SearchFacets'
import SearchFacetsControl from '../SearchFacetsControl'
import TagIcon from '../TagIcon'
import TextInputSearch from '../TextInputSearch'

const Controls = () => {
  const {assets, dialogs, folders, tags} = useMediaActors()
  const fetching = useSelector(assets, selectIsFetching)
  const pageIndex = useSelector(assets, (snapshot) => snapshot.context.pageIndex)
  const searchFacetCount = useSelector(assets, (snapshot) => snapshot.context.searchFacets.length)
  const foldersPanelVisible = useSelector(folders, (snapshot) => snapshot.context.panelVisible)
  const tagsPanelVisible = useSelector(tags, (snapshot) => snapshot.context.panelVisible)

  const mediaIndex = useMediaIndex()

  // Callbacks
  const handleShowSearchFacetDialog = () => {
    dialogs.send({type: 'dialog.open', dialog: searchFacetsDialog()})
  }

  const handleShowFoldersDialog = () => {
    dialogs.send({type: 'dialog.open', dialog: foldersDialog()})
  }

  const handleShowTagsDialog = () => {
    dialogs.send({type: 'dialog.open', dialog: tagsDialog()})
  }

  const toggleFoldersPanel = () => {
    folders.send({type: 'panel.visible.set', visible: !foldersPanelVisible})
  }

  const toggleTagsPanelToggle = () => {
    tags.send({type: 'panel.visible.set', visible: !tagsPanelVisible})
  }

  return (
    <Box
      paddingY={2}
      style={{
        borderBottom: '1px solid var(--card-border-color)',
        zIndex: 2,
      }}
    >
      {/* Rows: search / filters / orders  */}
      <Box marginBottom={2}>
        <Flex
          align="flex-start"
          direction={['column', 'column', 'column', 'column', 'row']}
          justify="space-between"
        >
          {/* Search + Filters */}
          <Flex
            flex={1}
            style={{
              alignItems: 'flex-start',
              flex: 1,
              height: '100%',
              justifyContent: mediaIndex < 2 ? 'space-between' : 'flex-start',
              position: 'relative',
              width: '100%',
            }}
          >
            <Box marginX={2} style={{minWidth: '200px'}}>
              {/* Search */}
              <TextInputSearch />
            </Box>

            <Box display={['none', 'none', 'block']}>
              <SearchFacets />

              {/* Search Facets Control (add / clear) */}
              <Inline gap={2}>
                <SearchFacetsControl />
              </Inline>
            </Box>

            <Box display={['block', 'block', 'none']} marginX={2}>
              <Inline gap={2} style={{whiteSpace: 'nowrap'}}>
                {/* Filters button (small) */}
                <Button
                  fontSize={1}
                  mode="ghost"
                  onClick={handleShowSearchFacetDialog}
                  text={`Filters${searchFacetCount > 0 ? ` (${searchFacetCount})` : ''}`}
                  tone="primary"
                />

                {/* Tags button (small) */}
                <Button
                  fontSize={1}
                  mode="ghost"
                  onClick={handleShowTagsDialog}
                  text={`Tags`}
                  tone="primary"
                />

                {/* Folders button (small) */}
                <Button
                  fontSize={1}
                  mode="ghost"
                  onClick={handleShowFoldersDialog}
                  text="Folders"
                  tone="primary"
                />
              </Inline>
            </Box>
          </Flex>
        </Flex>
      </Box>

      <Box>
        <Flex align="center" justify={['space-between']}>
          {/* Folders + Views */}
          <Box marginX={2}>
            <Inline gap={2} style={{whiteSpace: 'nowrap'}}>
              <Box display={['none', 'none', 'block']}>
                <Button
                  aria-label="Toggle folders panel"
                  fontSize={1}
                  icon={FolderIcon}
                  mode={foldersPanelVisible ? 'default' : 'ghost'}
                  onClick={toggleFoldersPanel}
                />
              </Box>
              <ButtonViewGroup />
            </Inline>
          </Box>

          <Flex marginX={2}>
            {/* Orders */}
            <OrderSelect />
            {/* Tags panel toggle */}
            <Box display={['none', 'none', 'block']} marginLeft={2}>
              <Button
                aria-label="Toggle tags panel"
                fontSize={1}
                icon={
                  <Box style={{transform: 'scale(0.75)'}}>
                    <TagIcon />
                  </Box>
                }
                onClick={toggleTagsPanelToggle}
                mode={tagsPanelVisible ? 'default' : 'ghost'}
                text={tagsPanelVisible ? 'Tags' : ''}
              />
            </Box>
          </Flex>
        </Flex>
      </Box>

      {/* Progress bar */}
      <Progress key={pageIndex} loading={fetching} />
    </Box>
  )
}

export default Controls
