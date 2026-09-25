import {ArrowDownIcon} from '@sanity/icons/ArrowDown'
import {ArrowUpIcon} from '@sanity/icons/ArrowUp'
import {CloseIcon} from '@sanity/icons/Close'
import {EditIcon} from '@sanity/icons/Edit'
import {SearchIcon} from '@sanity/icons/Search'
import {TrashIcon} from '@sanity/icons/Trash'
import {Box, Button, Container, Flex, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useSelector} from '@xstate/react'
import {type ReactNode} from 'react'
import {styled} from 'styled-components'

import {inputs} from '../../config/searchFacets'
import {PANEL_HEIGHT} from '../../constants'
import {useMediaActors} from '../../contexts/MediaActorsContext'
import {selectIsTagSearchFacet, selectPickedAssets} from '../../machines/assetsMachine'
import {
  confirmAddTagDialog,
  confirmDeleteTagDialog,
  confirmRemoveTagDialog,
  tagEditDialog,
} from '../../machines/dialogs'
import type {SearchFacetInputSearchableProps, TagActions, TagItem} from '../../types'

type Props = {
  actions?: TagActions[]
  tag: TagItem
}

const TagContainer = styled(Flex)`
  height: ${PANEL_HEIGHT}px;
`

const ButtonContainer = styled(Flex)`
  @media (pointer: fine) {
    visibility: hidden;
  }

  @media (hover: hover) and (pointer: fine) {
    ${TagContainer}:hover & {
      visibility: visible;
    }
  }
`

type TagButtonProps = {
  disabled?: boolean
  icon: ReactNode
  onClick: () => void
  tone?: 'critical' | 'primary'
  tooltip: string
}

const TagButton = (props: TagButtonProps) => {
  const {disabled, icon, onClick, tone, tooltip} = props

  return (
    <Tooltip
      animate
      content={
        <Container padding={2} width={0}>
          <Text muted size={1}>
            {tooltip}
          </Text>
        </Container>
      }
      disabled={'ontouchstart' in window}
      placement="top"
      portal
    >
      <Button
        disabled={disabled}
        fontSize={1}
        icon={icon}
        mode="bleed"
        onClick={onClick}
        padding={2}
        tone={tone}
      />
    </Tooltip>
  )
}

const Tag = (props: Props) => {
  const {actions, tag} = props

  const {assets, dialogs} = useMediaActors()
  const isSearchFacetTag = useSelector(assets, (snapshot) =>
    selectIsTagSearchFacet(snapshot, tag.tag._id),
  )

  // Picked assets are only needed on click, so they don't re-render every tag
  const getPickedAssets = () => selectPickedAssets(assets.getSnapshot())

  const handleSearchFacetTagRemove = () => {
    assets.send({type: 'search.tag.remove', tagId: tag.tag._id})
  }

  const handleShowAddTagToAssetsDialog = () => {
    dialogs.send({type: 'dialog.open', dialog: confirmAddTagDialog(getPickedAssets(), tag.tag)})
  }

  const handleShowRemoveTagFromAssetsDialog = () => {
    dialogs.send({type: 'dialog.open', dialog: confirmRemoveTagDialog(getPickedAssets(), tag.tag)})
  }

  const handleShowTagDeleteDialog = () => {
    dialogs.send({type: 'dialog.open', dialog: confirmDeleteTagDialog(tag.tag)})
  }

  const handleShowTagEditDialog = () => {
    dialogs.send({type: 'dialog.open', dialog: tagEditDialog(tag.tag._id)})
  }

  const handleSearchFacetTagAdd = () => {
    const searchFacet = {
      ...inputs.tag,
      value: {
        label: tag.tag.name.current,
        value: tag.tag._id,
      },
    } as SearchFacetInputSearchableProps

    assets.send({type: 'search.facet.add', facet: searchFacet})
  }

  return (
    <TagContainer align="center" flex={1} justify="space-between" paddingLeft={3}>
      <Box flex={1}>
        <Text
          muted
          size={1}
          style={{
            opacity: tag?.updating ? 0.5 : 1.0,
            userSelect: 'none',
          }}
          textOverflow="ellipsis"
        >
          {tag?.tag?.name?.current}
        </Text>
      </Box>

      <ButtonContainer align="center" style={{flexShrink: 0}}>
        {/* Search facet toggle */}
        {actions?.includes('search') && (
          <TagButton
            disabled={tag?.updating}
            icon={isSearchFacetTag ? <CloseIcon /> : <SearchIcon />}
            onClick={isSearchFacetTag ? handleSearchFacetTagRemove : handleSearchFacetTagAdd}
            tooltip={isSearchFacetTag ? 'Remove filter' : 'Filter by tag'}
          />
        )}
        {/* Edit icon */}
        {actions?.includes('edit') && (
          <TagButton
            disabled={tag?.updating}
            icon={<EditIcon />}
            onClick={handleShowTagEditDialog}
            tone="primary"
            tooltip="Edit tag"
          />
        )}
        {/* Apply to all */}
        {actions?.includes('applyAll') && (
          <TagButton
            disabled={tag?.updating}
            icon={<ArrowUpIcon />}
            onClick={handleShowAddTagToAssetsDialog}
            tone="primary"
            tooltip="Add tag to selected assets"
          />
        )}
        {/* Remove from all */}
        {actions?.includes('removeAll') && (
          <TagButton
            disabled={tag?.updating}
            icon={<ArrowDownIcon />}
            onClick={handleShowRemoveTagFromAssetsDialog}
            tone="critical"
            tooltip="Remove tag from selected assets"
          />
        )}

        {/* Delete icon */}
        {actions?.includes('delete') && (
          <TagButton
            disabled={tag?.updating}
            icon={<TrashIcon />}
            onClick={handleShowTagDeleteDialog}
            tone="critical"
            tooltip="Delete tag"
          />
        )}
      </ButtonContainer>
    </TagContainer>
  )
}

export default Tag
