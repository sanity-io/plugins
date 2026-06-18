import {Box, Button, Card, Flex, Label, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'

import {IndexState} from '../api/embeddingsApi'

export interface IndexListProps {
  loading: boolean
  selectedIndex?: IndexState
  indexes: IndexState[]
  onIndexSelected: (index: IndexState) => void
}

export function IndexList(props: IndexListProps) {
  const {loading, selectedIndex, indexes, onIndexSelected} = props
  return (
    <Card tone="default" style={{opacity: loading ? 0.5 : 1}}>
      <Stack space={2}>
        <Card borderBottom flex={1} paddingBottom={2} padding={3}>
          <Flex>
            <Box flex={1}>
              <Label muted>Index name</Label>
            </Box>
            <Box flex={1}>
              <Label muted>Dataset</Label>
            </Box>
            <Box flex={1}>
              <Label muted>Status</Label>
            </Box>
            <Box flex={1}>
              <Label muted>Progress</Label>
            </Box>
          </Flex>
        </Card>
        {indexes.length ? (
          <Stack space={2} style={{maxHeight: 200, overflow: 'auto'}}>
            {indexes.map((index) => (
              <IndexRow
                selectedIndex={selectedIndex}
                index={index}
                onIndexSelected={onIndexSelected}
                key={index.indexName}
              />
            ))}
          </Stack>
        ) : (
          <Text muted>No indexes found.</Text>
        )}
      </Stack>
    </Card>
  )
}

function IndexRow(props: {
  selectedIndex?: IndexState
  index: IndexState
  onIndexSelected: (index: IndexState) => void
}) {
  const {selectedIndex, index, onIndexSelected} = props
  const onSelect = useCallback(() => onIndexSelected(index), [onIndexSelected, index])
  return (
    <Button
      tone={selectedIndex?.indexName === index.indexName ? 'primary' : 'default'}
      mode={selectedIndex?.indexName === index.indexName ? 'default' : 'ghost'}
      onClick={onSelect}
      key={index.indexName}
      padding={3}
    >
      <Flex>
        <Box flex={1}>
          <strong>{index.indexName}</strong>
        </Box>
        <Box flex={1}>{index.dataset}</Box>
        <Box flex={1}>{index.status}</Box>
        <Box flex={1}>
          {index.startDocumentCount
            ? Math.floor(
                ((index.startDocumentCount - index.remainingDocumentCount) /
                  index.startDocumentCount) *
                  100,
              )
            : '?'}
          %
        </Box>
      </Flex>
    </Button>
  )
}
