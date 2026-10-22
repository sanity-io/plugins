import {Box, Card, Flex, Stack, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type CSSProperties} from 'react'
import {useDispatch} from 'react-redux'
import {useColorSchemeValue} from 'sanity'

import {foldersActions} from '../../modules/folders'
import {getSchemeColor} from '../../utils/getSchemeColor'

import * as styles from './CardFolder.module.css'

type Props = {
  folderId: string
  name: string
  totalCount: number
}

interface FolderGlyphStyle extends CSSProperties {
  '--media-folder-glyph-color'?: string
}

const CardFolder = ({folderId, name, totalCount}: Props) => {
  const dispatch = useDispatch()
  const scheme = useColorSchemeValue()
  const {color} = useThemeV2()

  const folderGlyphStyle: FolderGlyphStyle = {
    '--media-folder-glyph-color': color.avatar.yellow.bg,
  }

  return (
    <Flex className={styles.cardWrapper} padding={1}>
      <Card
        className={styles.folderCard}
        onClick={() => dispatch(foldersActions.currentFolderSet({folderId}))}
        padding={3}
        radius={2}
        style={{
          background: getSchemeColor(scheme, 'bg'),
          border: '1px solid transparent',
        }}
      >
        <Flex direction="column" height="fill" justify="space-between">
          <Flex align="center" flex={1} justify="center">
            <Box className={styles.folderGlyph} style={folderGlyphStyle} />
          </Flex>

          <Stack gap={2}>
            <Text
              size={1}
              style={{lineHeight: '1.35em', minHeight: '2.7em', wordBreak: 'break-word'}}
              weight="semibold"
            >
              {name}
            </Text>
            <Text muted size={0} style={{lineHeight: '1.2em'}}>
              {totalCount} item{totalCount === 1 ? '' : 's'}
            </Text>
          </Stack>
        </Flex>
      </Card>
    </Flex>
  )
}

export default CardFolder
