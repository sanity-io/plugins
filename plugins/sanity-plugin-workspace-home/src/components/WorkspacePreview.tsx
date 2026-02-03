import {DatabaseIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Grid, Hotkeys, Stack, Text} from '@sanity/ui'
import {isValidElement, useMemo} from 'react'
import {isValidElementType} from 'react-is'
import {useActiveWorkspace, type WorkspaceSummary} from 'sanity'
import {styled} from 'styled-components'

const createIcon = (Icon: React.ComponentType | React.ReactNode) => {
  if (isValidElementType(Icon)) return <Icon />
  if (isValidElement(Icon)) return Icon
  return undefined
}

const MediaCard = styled(Card)`
  width: 35px;
  height: 35px;

  svg {
    width: 100%;
    height: 100%;
  }
`

export type WorkspacePreviewProps = {
  workspace: WorkspaceSummary
  index: number
  query: string
}

export default function WorkspacePreview(props: WorkspacePreviewProps): React.JSX.Element {
  const {workspace, index, query} = props
  const {icon, title, name, subtitle, dataset} = workspace

  const {setActiveWorkspace} = useActiveWorkspace()
  const iconComponent = useMemo(() => createIcon(icon), [icon])

  // TODO: Favorites feature
  // get favorite workspace name from localStorage
  //   const favoriteWorkspace = localStorage.getItem('favoriteWorkspace')
  //   save local state to force re-render
  //   const [isFavourite, setIsFavourite] = React.useState(favoriteWorkspace === name)

  // set favorite workspace name to localStorage
  //   const setFavoriteWorkspace = useCallback(() => {
  //     localStorage.setItem('favoriteWorkspace', name)
  //   }, [name])

  const hotKeyIndex = index + 1 === 10 ? 0 : index + 1

  return (
    <Card borderTop={Boolean(index)} tone="default">
      <Grid columns={5} gap={[2, 3, 4, 4]} paddingY={1}>
        <Card columnStart={1} columnEnd={4}>
          <Stack>
            <Button mode="bleed" tone="default" onClick={() => setActiveWorkspace(name)}>
              <Flex align="center" gap={[2, 3, 4, 4]}>
                {iconComponent ? <MediaCard>{createIcon(iconComponent)}</MediaCard> : null}
                <Box flex={1}>
                  <Stack space={[1, 2, 3, 3]}>
                    <Text size={3} weight="semibold" textOverflow="ellipsis">
                      {title || name}
                    </Text>
                    {subtitle ? <Text muted>{subtitle}</Text> : null}
                  </Stack>
                </Box>
              </Flex>
            </Button>
          </Stack>
        </Card>
        <Card columnStart={4} columnEnd={5}>
          <Flex height="fill" align="center" gap={2}>
            <Text size={1} weight="semibold">
              <DatabaseIcon />
            </Text>
            <Text size={1} weight="semibold" textOverflow="ellipsis">
              {dataset}
            </Text>
          </Flex>
        </Card>
        <Card paddingRight={[2, 3, 3, 3]}>
          <Flex height="fill" align="center" justify="flex-end">
            {!query && hotKeyIndex < 10 ? (
              <Hotkeys keys={[String(hotKeyIndex)]} padding={2} />
            ) : null}
          </Flex>
        </Card>
        {/* <Button
          mode={isFavourite ? 'default' : 'bleed'}
          tone={isFavourite ? 'primary' : 'default'}
          icon={StarIcon}
          title="Favorite"
          onClick={() => {
            setIsFavourite(!isFavourite)
            setFavoriteWorkspace()
          }}
        /> */}
      </Grid>
    </Card>
  )
}
