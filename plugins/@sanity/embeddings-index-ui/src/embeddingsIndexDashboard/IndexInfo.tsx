import {EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Flex,
  Heading,
  Label,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Text,
} from '@sanity/ui'
import {useCallback} from 'react'

import {IndexState} from '../api/embeddingsApi'
import {IndexEditor} from './IndexEditor'
import {QueryIndex} from './QueryIndex'

export interface IndexInfoProps {
  selectedIndex: IndexState
  onDeleteIndex: (index: IndexState) => void
}

export function IndexInfo({selectedIndex, onDeleteIndex}: IndexInfoProps) {
  const handleDelete = useCallback(
    () => onDeleteIndex(selectedIndex),
    [selectedIndex, onDeleteIndex],
  )
  return (
    <Stack space={4} flex={1}>
      <Flex align="center" flex={1} gap={2}>
        <Box flex={1}>
          <Heading>Index: {selectedIndex?.indexName ?? 'Untitled'}</Heading>
        </Box>
        <Box>
          <MenuButton
            button={
              <Button
                title="Open index actions"
                icon={EllipsisVerticalIcon}
                padding={2}
                mode="ghost"
              />
            }
            id={`button-${selectedIndex.indexName}`}
            menu={
              <Menu>
                <MenuItem
                  text="Delete index"
                  icon={TrashIcon}
                  tone="critical"
                  onClick={handleDelete}
                />
              </Menu>
            }
            popover={{placement: 'right'}}
          />
        </Box>
      </Flex>

      <Flex gap={6}>
        <Stack space={4} flex={1} style={{maxWidth: 600}}>
          <Box>
            <IndexEditor index={selectedIndex} readOnly />
          </Box>
          <IndexStatus selectedIndex={selectedIndex} />
        </Stack>

        <Stack space={3} flex={1}>
          <Label muted>Query index</Label>
          <QueryIndex indexName={selectedIndex.indexName} key={selectedIndex.indexName} />
        </Stack>
      </Flex>
    </Stack>
  )
}

function IndexStatus({selectedIndex}: {selectedIndex: IndexState}) {
  return (
    <Stack space={4} flex={1}>
      <Flex gap={2} align="center">
        <Box flex={1}>
          <Label size={1} muted>
            Status
          </Label>
        </Box>
        <Stack space={2}>
          <Text>{selectedIndex.status}</Text>
        </Stack>
      </Flex>
      <Flex gap={5} align="center">
        <Box flex={1}>
          <Label size={1} muted>
            Indexing progress
          </Label>
        </Box>
        <Stack space={2}>
          <Text>
            {selectedIndex.startDocumentCount - selectedIndex.remainingDocumentCount} /{' '}
            {selectedIndex.startDocumentCount}
          </Text>
        </Stack>
      </Flex>
      <Flex gap={5} align="center">
        <Box flex={1}>
          <Label size={1} muted>
            Failed documents
          </Label>
        </Box>
        <Stack space={2}>
          <Text>{selectedIndex.failedDocumentCount}</Text>
        </Stack>
      </Flex>
    </Stack>
  )
}
