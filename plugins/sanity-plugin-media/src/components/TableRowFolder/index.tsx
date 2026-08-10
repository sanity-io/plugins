import {Box, Flex, Grid, Stack, Text, useMediaIndex, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx/lite'
import {type ComponentProps} from 'react'
import {useDispatch} from 'react-redux'
import {useColorSchemeValue} from 'sanity'

import {GRID_TEMPLATE_COLUMNS} from '../../constants'
import {foldersActions} from '../../modules/folders'
import {getSchemeColor} from '../../utils/getSchemeColor'

import {containerGrid, folderBadge, hoverBgVar, spotYellowVar} from './TableRowFolder.css'

type Props = {
  folderId: string
  name: string
  totalCount: number
}

function ContainerGrid({className, style, ...props}: ComponentProps<typeof Grid>) {
  const {color} = useThemeV2()

  return (
    <Grid
      {...props}
      className={clsx(containerGrid, className)}
      style={{...style, ...assignInlineVars({[hoverBgVar]: color.bg})}}
    />
  )
}

function FolderBadge({className, style, ...props}: ComponentProps<typeof Box>) {
  const {color} = useThemeV2()

  return (
    <Box
      {...props}
      className={clsx(folderBadge, className)}
      style={{...style, ...assignInlineVars({[spotYellowVar]: color.avatar.yellow.bg})}}
    />
  )
}

const TableRowFolder = ({folderId, name, totalCount}: Props) => {
  const dispatch = useDispatch()
  const mediaIndex = useMediaIndex()
  const scheme = useColorSchemeValue()

  return (
    <ContainerGrid
      onClick={() => dispatch(foldersActions.currentFolderSet({folderId}))}
      style={{
        background: getSchemeColor(scheme, 'bg'),
        gridColumnGap: mediaIndex < 3 ? 0 : '16px',
        gridTemplateColumns:
          mediaIndex < 3 ? GRID_TEMPLATE_COLUMNS.SMALL : GRID_TEMPLATE_COLUMNS.LARGE,
        gridTemplateRows: mediaIndex < 3 ? 'auto' : '1fr',
      }}
    >
      <Box />
      <Flex align="center" justify="center" style={{gridColumn: 2, height: '90px', width: '100px'}}>
        <FolderBadge />
      </Flex>
      <Box
        marginLeft={mediaIndex < 3 ? 3 : 0}
        style={{gridColumn: mediaIndex < 3 ? 3 : 3, gridRow: mediaIndex < 3 ? '2/4' : 'auto'}}
      >
        <Stack space={2}>
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
    </ContainerGrid>
  )
}

export default TableRowFolder
