import {Box, Card, Flex, Stack, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx/lite'
import {type ComponentProps} from 'react'
import {useDispatch} from 'react-redux'
import {useColorSchemeValue} from 'sanity'

import {foldersActions} from '../../modules/folders'
import {getSchemeColor} from '../../utils/getSchemeColor'

import {cardWrapper, folderCard, folderGlyph, spotYellowVar} from './CardFolder.css'

type Props = {
  folderId: string
  name: string
  totalCount: number
}

function CardWrapper({className, ...props}: ComponentProps<typeof Flex>) {
  return <Flex {...props} className={clsx(cardWrapper, className)} />
}

function FolderCard({className, ...props}: ComponentProps<typeof Card>) {
  return <Card {...props} className={clsx(folderCard, className)} />
}

function FolderGlyph({className, style, ...props}: ComponentProps<typeof Box>) {
  const {color} = useThemeV2()

  return (
    <Box
      {...props}
      className={clsx(folderGlyph, className)}
      style={{...style, ...assignInlineVars({[spotYellowVar]: color.avatar.yellow.bg})}}
    />
  )
}

const CardFolder = ({folderId, name, totalCount}: Props) => {
  const dispatch = useDispatch()
  const scheme = useColorSchemeValue()

  return (
    <CardWrapper padding={1}>
      <FolderCard
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
            <FolderGlyph />
          </Flex>

          <Stack space={2}>
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
      </FolderCard>
    </CardWrapper>
  )
}

export default CardFolder
