import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useColorSchemeValue} from 'sanity'
import {css, styled} from 'styled-components'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import {getSchemeColor} from '../../utils/getSchemeColor'

type Props = {
  folderId: string
  name: string
  totalCount: number
}

const CardWrapper = styled(Flex)`
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
`

const FolderCard = styled(Card)`
  cursor: pointer;
  height: 100%;
  transition: border-color 200ms ease;
  width: 100%;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      border-color: var(--card-border-color);
    }
  }
`

const FolderGlyph = styled(Box)(
  ({theme}) => css`
    align-items: flex-end;
    background: linear-gradient(
      180deg,
      ${
          // oxlint-disable-next-line no-deprecated -- deferred to a follow-up PR
          theme.sanity.color.spot.yellow
        }
        0%,
      ${
          // oxlint-disable-next-line no-deprecated -- deferred to a follow-up PR
          theme.sanity.color.spot.yellow
        }
        100%
    );
    border-radius: 8px;
    display: flex;
    height: 72px;
    position: relative;
    width: 96px;

    &::before {
      background: ${
        // oxlint-disable-next-line no-deprecated -- deferred to a follow-up PR
        theme.sanity.color.spot.yellow
      };
      border-radius: 8px 8px 0 0;
      content: '';
      height: 18px;
      left: 0;
      position: absolute;
      top: -8px;
      width: 38px;
    }
  `,
)

const CardFolder = ({folderId, name, totalCount}: Props) => {
  const {assets} = useMediaActors()
  const scheme = useColorSchemeValue()

  return (
    <CardWrapper padding={1}>
      <FolderCard
        onClick={() => assets.send({type: 'folder.open', folderId})}
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
      </FolderCard>
    </CardWrapper>
  )
}

export default CardFolder
