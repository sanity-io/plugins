import {SearchIcon} from '@sanity/icons/Search'
import {Box, Button, Card, Flex, Select, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {type ChangeEvent, useEffect, useState} from 'react'

import {useReplacementAssets} from '../../hooks/useReplacementAssets'
import useTypedSelector from '../../hooks/useTypedSelector'
import {selectFolderTree} from '../../modules/folders'
import {selectTags} from '../../modules/tags'
import type {FolderTreeNode, ImageAsset} from '../../types'
import ReplacementAssetGrid from '../ReplacementAssetGrid'

const SEARCH_DEBOUNCE_MS = 300

export type ReplaceAssetsFilterState = {
  folderId: string | null
  searchInput: string
  tagId: string | null
}

export const initialReplaceAssetsFilterState: ReplaceAssetsFilterState = {
  folderId: null,
  searchInput: '',
  tagId: null,
}

type Props = {
  assetToReplaceId: string
  filterState: ReplaceAssetsFilterState
  onFilterStateChange: (filterState: ReplaceAssetsFilterState) => void
  onSelect: (asset: ImageAsset) => void
}

const flattenFolderTree = (nodes: FolderTreeNode[]): FolderTreeNode[] =>
  nodes.flatMap((node) => [node, ...flattenFolderTree(node.children)])

/**
 * Lists every image that can replace `assetToReplaceId`, with its own search, tag and
 * folder filters. It deliberately starts from a clean slate rather than the browser's
 * current search, and never changes the browser's state.
 */
const ReplaceAssetsOverview = (props: Props) => {
  const {assetToReplaceId, filterState, onFilterStateChange, onSelect} = props
  const {folderId, searchInput, tagId} = filterState

  const tags = useTypedSelector(selectTags)
  const folderTree = useTypedSelector(selectFolderTree)
  const folders = flattenFolderTree(folderTree)
  const sortedTags = tags
    .map((item) => item.tag)
    .sort((a, b) => a.name.current.localeCompare(b.name.current))

  const [searchQuery, setSearchQuery] = useState(() => searchInput.trim())
  useEffect(() => {
    const timeout = setTimeout(() => setSearchQuery(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const {error, items, loading, loadMore, retry} = useReplacementAssets({
    assetToReplaceId,
    filters: {folderId, searchQuery, tagId},
  })

  const filtered = Boolean(searchQuery || folderId || tagId)
  const pendingSearch = searchInput.trim() !== searchQuery

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFilterStateChange({...filterState, searchInput: event.currentTarget.value})
  }
  const handleSearchClear = () => {
    onFilterStateChange({...filterState, searchInput: ''})
  }
  const handleTagChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onFilterStateChange({...filterState, tagId: event.currentTarget.value || null})
  }
  const handleFolderChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onFilterStateChange({...filterState, folderId: event.currentTarget.value || null})
  }
  const handleClearFilters = () => {
    onFilterStateChange(initialReplaceAssetsFilterState)
  }

  const renderBody = () => {
    if (error && items.length === 0) {
      return (
        <Card padding={4} radius={2} tone="critical">
          <Stack gap={3}>
            <Text size={1}>Could not load images: {error}</Text>
            <Box>
              <Button fontSize={1} mode="ghost" onClick={retry} text="Try again" />
            </Box>
          </Stack>
        </Card>
      )
    }

    if (items.length === 0 && !loading && !pendingSearch) {
      return (
        <Box padding={5}>
          <Stack gap={3}>
            <Text size={1} weight="semibold">
              {filtered ? 'No images match your search' : 'There are no replacement images'}
            </Text>
            {filtered && (
              <Box>
                <Button
                  fontSize={1}
                  mode="ghost"
                  onClick={handleClearFilters}
                  text="Clear search and filters"
                />
              </Box>
            )}
          </Stack>
        </Box>
      )
    }

    if (items.length === 0) {
      return (
        <Flex align="center" justify="center" padding={5}>
          <Spinner muted />
        </Flex>
      )
    }

    return <ReplacementAssetGrid items={items} onLoadMore={loadMore} onSelect={onSelect} />
  }

  return (
    <Flex direction="column" gap={3} style={{height: '100%'}}>
      <Flex align="center" gap={2} wrap="wrap">
        <Box flex={2} style={{minWidth: '200px'}}>
          <TextInput
            aria-label="Search images"
            autoFocus
            clearButton={searchInput.length > 0}
            fontSize={1}
            icon={SearchIcon}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            placeholder="Search by filename, title, alt text or description"
            radius={2}
            value={searchInput}
          />
        </Box>

        {sortedTags.length > 0 && (
          <Box flex={1} style={{minWidth: '160px'}}>
            <Select
              aria-label="Filter by tag"
              fontSize={1}
              onChange={handleTagChange}
              radius={2}
              value={tagId ?? ''}
            >
              <option value="">All tags</option>
              {sortedTags.map((tag) => (
                <option key={tag._id} value={tag._id}>
                  {tag.name.current}
                </option>
              ))}
            </Select>
          </Box>
        )}

        {folders.length > 0 && (
          <Box flex={1} style={{minWidth: '160px'}}>
            <Select
              aria-label="Filter by folder"
              fontSize={1}
              onChange={handleFolderChange}
              radius={2}
              value={folderId ?? ''}
            >
              <option value="">All folders</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.path}
                </option>
              ))}
            </Select>
          </Box>
        )}

        <Box style={{visibility: loading || pendingSearch ? 'visible' : 'hidden'}}>
          <Spinner muted aria-label="Loading images" />
        </Box>
      </Flex>

      {error && items.length > 0 && (
        <Card padding={3} radius={2} tone="critical">
          <Flex align="center" gap={3} justify="space-between">
            <Text size={1}>Could not load more images: {error}</Text>
            <Button fontSize={1} mode="ghost" onClick={retry} text="Try again" />
          </Flex>
        </Card>
      )}

      <Box flex={1} style={{minHeight: 0}}>
        {renderBody()}
      </Box>
    </Flex>
  )
}

export default ReplaceAssetsOverview
