import {ComposeIcon} from '@sanity/icons/Compose'
import {Box, Button, Flex, Inline, Label} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {useColorSchemeValue} from 'sanity'

import {PANEL_HEIGHT} from '../../constants'
import {useMediaActors} from '../../contexts/MediaActorsContext'
import {tagCreateDialog} from '../../machines/dialogs'
import {selectIsCreatingTag, selectIsFetchingTags} from '../../machines/tagsMachine'
import {getSchemeColor} from '../../utils/getSchemeColor'

type Props = {
  allowCreate?: boolean
  light?: boolean
  title: string
}

const TagViewHeader = ({allowCreate, light, title}: Props) => {
  const scheme = useColorSchemeValue()

  const {dialogs, tags} = useMediaActors()
  const tagsCreating = useSelector(tags, selectIsCreatingTag)
  const tagsFetching = useSelector(tags, selectIsFetchingTags)

  const handleTagCreate = () => {
    dialogs.send({type: 'dialog.open', dialog: tagCreateDialog()})
  }

  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        paddingLeft={3}
        style={{
          background: light ? getSchemeColor(scheme, 'bg') : 'inherit',
          borderBottom: '1px solid var(--card-border-color)',
          flexShrink: 0,
          height: `${PANEL_HEIGHT}px`,
        }}
      >
        <Inline gap={2}>
          <Label size={0}>{title}</Label>
          {tagsFetching && (
            <Label size={0} style={{opacity: 0.3}}>
              Loading...
            </Label>
          )}
        </Inline>
        {/* Create new tag button */}
        {allowCreate && (
          <Box marginRight={1}>
            <Button
              disabled={tagsCreating}
              fontSize={1} //
              icon={ComposeIcon}
              mode="bleed"
              onClick={handleTagCreate}
              aria-label="Create tag"
              style={{
                background: 'transparent',
                boxShadow: 'none',
              }}
            />
          </Box>
        )}
      </Flex>
    </>
  )
}

export default TagViewHeader
