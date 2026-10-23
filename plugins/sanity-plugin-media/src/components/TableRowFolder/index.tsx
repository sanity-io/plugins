import {Box, Flex, Grid, Stack, Text, useMediaIndex, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type CSSProperties} from 'react'
import {useDispatch} from 'react-redux'
import {useColorSchemeValue} from 'sanity'

import {GRID_TEMPLATE_COLUMNS} from '../../constants'
import {foldersActions} from '../../modules/folders'
import {getSchemeColor} from '../../utils/getSchemeColor'

import * as styles from './TableRowFolder.module.css'

type Props = {
  folderId: string
  name: string
  totalCount: number
}

interface FolderGlyphStyle extends CSSProperties {
  '--media-folder-glyph-color'?: string
}

const TableRowFolder = ({folderId, name, totalCount}: Props) => {
  const dispatch = useDispatch()
  const mediaIndex = useMediaIndex()
  const scheme = useColorSchemeValue()
  const {color} = useThemeV2()

  const folderGlyphStyle: FolderGlyphStyle = {
    '--media-folder-glyph-color': color.avatar.yellow.bg,
  }

  return (
    <Grid
      className={styles.containerGrid}
      onClick={() => dispatch(foldersActions.currentFolderSet({folderId}))}
      style={{
        background: getSchemeColor(scheme, 'bg'),
        columnGap: mediaIndex < 3 ? 0 : '16px',
        gridTemplateColumns:
          mediaIndex < 3 ? GRID_TEMPLATE_COLUMNS.SMALL : GRID_TEMPLATE_COLUMNS.LARGE,
        gridTemplateRows: mediaIndex < 3 ? 'auto' : '1fr',
      }}
    >
      <Box />
      <Flex align="center" justify="center" style={{gridColumn: 2, height: '90px', width: '100px'}}>
        <Box className={styles.folderBadge} style={folderGlyphStyle} />
      </Flex>
      <Box
        marginLeft={mediaIndex < 3 ? 3 : 0}
        style={{gridColumn: mediaIndex < 3 ? 3 : 3, gridRow: mediaIndex < 3 ? '2/4' : 'auto'}}
      >
        <Stack gap={2}>
          <Text size={1} style={{lineHeight: '1.2em'}} textOverflow="ellipsis" weight="semibold">
            {name}
          </Text>
          <Text muted size={0} style={{lineHeight: '1.1em'}}>
            Folder
          </Text>
        </Stack>
      </Box>
      <Box style={{display: mediaIndex < 3 ? 'none' : 'block', gridColumn: 7}}>
        <Text muted size={1}>
          {totalCount} item{totalCount === 1 ? '' : 's'}
        </Text>
      </Box>
      <Box style={{display: mediaIndex < 3 ? 'none' : 'block', gridColumn: 8}}>
        <Text muted size={1}>
          Open folder
        </Text>
      </Box>
      <Box />
    </Grid>
  )
}

export default TableRowFolder
