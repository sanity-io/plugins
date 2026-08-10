import {Box, Flex, Grid, Stack, Text, useMediaIndex} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {useDispatch} from 'react-redux'
import {useColorSchemeValue} from 'sanity'
import {css, styled} from 'styled-components'

import {GRID_TEMPLATE_COLUMNS} from '../../constants'
import {foldersActions} from '../../modules/folders'
import {getSchemeColor} from '../../utils/getSchemeColor'

type Props = {
  folderId: string
  name: string
  totalCount: number
}

const ContainerGrid = styled(Grid)(
  ({theme}) => css`
    align-items: center;
    cursor: pointer;
    height: 100%;
    user-select: none;
    white-space: nowrap;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: ${getTheme_v2(theme).color.bg};
      }
    }
  `,
)

const FolderBadge = styled(Box)(({theme}) => {
  const yellow = getTheme_v2(theme).color.avatar.yellow.bg
  return css`
    background: ${yellow};
    border-radius: 6px;
    height: 42px;
    position: relative;
    width: 52px;

    &::before {
      background: ${yellow};
      border-radius: 6px 6px 0 0;
      content: '';
      height: 12px;
      left: 0;
      position: absolute;
      top: -6px;
      width: 18px;
    }
  `
})

const TableRowFolder = ({folderId, name, totalCount}: Props) => {
  const dispatch = useDispatch()
  const mediaIndex = useMediaIndex()
  const scheme = useColorSchemeValue()

  return (
    <ContainerGrid
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
        <FolderBadge />
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
    </ContainerGrid>
  )
}

export default TableRowFolder
