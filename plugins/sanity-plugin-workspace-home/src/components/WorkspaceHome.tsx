import {Box, Card, Container, Flex, Heading, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useActiveWorkspace, useWorkspaces} from 'sanity'
import {styled} from 'styled-components'

import WorkspacePreview from './WorkspacePreview'

const TallCard = styled(Card)`
  min-height: 100%;
`

export default function WorkspaceHome(): React.JSX.Element {
  const [, ...workspaces] = useWorkspaces()
  const {setActiveWorkspace} = useActiveWorkspace()

  // Handle search query
  const [query, setQuery] = useState('')
  const searchInput = useRef(null)
  const handleQuery = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value)
    },
    [setQuery],
  )

  // filter workspaces if name, dataset or title matches query
  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter((workspace) => {
      return (
        workspace.name.toLowerCase().includes(query.toLowerCase()) ||
        workspace.dataset.toLowerCase().includes(query.toLowerCase()) ||
        workspace.title.toLowerCase().includes(query.toLowerCase())
      )
    })
  }, [workspaces, query])

  // Listen to keypress of workspace index
  useEffect(() => {
    const handleKeypress = (event: KeyboardEvent) => {
      // Ignore if search query exists or search input is focused
      if (query || searchInput.current === document.activeElement) {
        return
      }

      const index = parseInt(event.key, 10) - 1
      if (index >= 0 && index < workspaces.length) {
        setActiveWorkspace(workspaces[index]!.name)
      }
    }

    window.addEventListener('keypress', handleKeypress)

    return () => {
      window.removeEventListener('keypress', handleKeypress)
    }
  }, [query, workspaces, setActiveWorkspace])

  return (
    <TallCard tone="transparent">
      <Flex direction="column" padding={[4, 5, 6, 6]}>
        <Container>
          <Stack space={4}>
            <Heading>Workspaces</Heading>
            <Card padding={[2, 3, 4, 4]} radius={3} shadow={2}>
              <Stack space={3}>
                <Stack space={2}>
                  <Text size={1} weight="semibold">
                    Search
                  </Text>
                  <TextInput ref={searchInput} value={query} onChange={handleQuery} />
                </Stack>
                <Box>
                  {filteredWorkspaces.map((workspace, index) => (
                    <WorkspacePreview
                      key={workspace.name}
                      workspace={workspace}
                      index={index}
                      query={query}
                    />
                  ))}
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Container>
      </Flex>
    </TallCard>
  )
}
