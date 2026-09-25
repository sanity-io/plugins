import {AddIcon} from '@sanity/icons/Add'
import {EditIcon} from '@sanity/icons/Edit'
import {FolderIcon} from '@sanity/icons/Folder'
import {TrashIcon} from '@sanity/icons/Trash'
import {Box, Button, Container, Flex, Inline, Label, Text, Tree, TreeItem} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useSelector} from '@xstate/react'
import {type DragEvent, type ReactNode, useEffect, useMemo, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {PANEL_HEIGHT} from '../../constants'
import {useMediaActors} from '../../contexts/MediaActorsContext'
import {
  confirmDeleteFolderDialog,
  folderCreateDialog,
  folderRenameDialog,
} from '../../machines/dialogs'
import {selectIsFetchingFolders} from '../../machines/foldersMachine'
import type {AssetItem, FolderTreeNode} from '../../types'
import {getDragAssetIds, isAssetDrag} from '../../utils/assetDrag'

const getExpandedIdSet = (
  folderId: string | null,
  byId: Record<string, {parentId: string | null}>,
) => {
  const expanded = new Set<string>()
  let cursor: string | null = folderId
  while (cursor) {
    const node = byId[cursor]
    if (!node) break
    expanded.add(cursor)
    cursor = node.parentId
  }
  return expanded
}

type DropTargetHandlers = {
  onDragEnter: (e: DragEvent<HTMLLIElement>) => void
  onDragLeave: (e: DragEvent<HTMLLIElement>) => void
  onDragOver: (e: DragEvent<HTMLLIElement>) => void
  onDrop: (e: DragEvent<HTMLLIElement>) => void
}

type FolderNodeProps = {
  currentFolderId: string | null
  dropTargetId: string | null
  expandedIds: Set<string>
  getDropTargetHandlers: (folderId: string | null) => DropTargetHandlers
  node: FolderTreeNode
  onSelect: (folderId: string) => void
}

// Rings the row box of the folder that dragged assets currently hover over.
// The attribute sits on the tree item, so the ring must target the direct row box
// rather than the whole subtree. Styled via CSS because `TreeItem` offers no prop
// for the row box across supported `@sanity/ui` versions.
const DropTree = styled(Tree)`
  [data-drop-target] > [data-ui='TreeItem__box'] {
    box-shadow: inset 0 0 0 2px var(--card-focus-ring-color);
  }
`

// Identifier for the "All assets" drop target, which removes assets from their folder
const ROOT_DROP_TARGET_ID = '__all-assets'

type FolderHeaderActionProps = {
  disabled?: boolean
  icon: ReactNode
  onClick: () => void
  tone?: 'critical' | 'default' | 'primary'
  tooltip: string
}

const FolderHeaderAction = ({
  disabled = false,
  icon,
  onClick,
  tone = 'default',
  tooltip,
}: FolderHeaderActionProps) => (
  <Tooltip
    animate
    content={
      <Container padding={2} width={0}>
        <Text muted size={1}>
          {tooltip}
        </Text>
      </Container>
    }
    disabled={typeof window !== 'undefined' && 'ontouchstart' in window}
    placement="top"
    portal
  >
    <Button
      aria-label={tooltip}
      disabled={disabled}
      fontSize={1}
      icon={icon}
      mode="bleed"
      onClick={onClick}
      padding={2}
      tone={tone}
    />
  </Tooltip>
)

type FolderItemTextProps = {
  name: string
  totalCount: number
}

/**
 * this uses some hacky css to get the desired layout
 * The tree item is a text container, so we need to use a span to wrap the content
 */
const FolderItemText = ({name, totalCount}: FolderItemTextProps) => (
  <span
    style={{
      boxSizing: 'border-box',
      display: 'block',
      maxWidth: '100%',
      minWidth: 0,
      overflow: 'hidden',
      paddingRight: '2rem',
      position: 'relative',
      width: '100%',
    }}
  >
    <span
      style={{
        alignItems: 'center',
        display: 'flex',
        paddingLeft: '0.25rem',
        gap: '0.5rem',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <span style={{display: 'inline-flex', flexShrink: 0, lineHeight: 0}}>
        <FolderIcon />
      </span>
      <span
        style={{
          display: 'block',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </span>
    </span>
    <span
      style={{
        fontSize: '0.75rem',
        opacity: 0.78,
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
      }}
    >
      {totalCount}
    </span>
  </span>
)

const FolderNode = ({
  currentFolderId,
  dropTargetId,
  expandedIds,
  getDropTargetHandlers,
  node,
  onSelect,
}: FolderNodeProps) => {
  const hasChildren = node.children.length > 0
  const selected = currentFolderId === node.id
  const isDropTarget = dropTargetId === node.id

  return (
    <TreeItem
      expanded={expandedIds.has(node.id)}
      id={node.id}
      onClick={() => onSelect(node.id)}
      data-drop-target={isDropTarget ? '' : undefined}
      selected={selected}
      text={<FolderItemText name={node.name} totalCount={node.totalCount} />}
      weight={selected ? 'semibold' : 'medium'}
      {...getDropTargetHandlers(node.id)}
    >
      {hasChildren &&
        node.children.map((childNode) => (
          <FolderNode
            currentFolderId={currentFolderId}
            dropTargetId={dropTargetId}
            expandedIds={expandedIds}
            getDropTargetHandlers={getDropTargetHandlers}
            key={childNode.id}
            node={childNode}
            onSelect={onSelect}
          />
        ))}
    </TreeItem>
  )
}

const FolderView = () => {
  const {assets, dialogs, folders} = useMediaActors()
  const currentFolderId = useSelector(assets, (snapshot) => snapshot.context.currentFolderId)
  const byId = useSelector(folders, (snapshot) => snapshot.context.byId)
  const fetching = useSelector(folders, selectIsFetchingFolders)
  const folderTree = useSelector(folders, (snapshot) => snapshot.context.tree)
  const currentFolder = currentFolderId ? byId[currentFolderId] : null
  const expandedIds = useMemo(
    () => getExpandedIdSet(currentFolderId, byId),
    [byId, currentFolderId],
  )
  const treeKey = useMemo(() => Array.from(expandedIds).join('|') || 'root', [expandedIds])

  const hasFolders = folderTree.length > 0

  // Folder id (or root marker) that dragged assets are currently hovering over
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  // Nesting depth of dragenter/dragleave per target. Browsers fire dragleave when moving
  // between an element's own descendants (Chrome reports no relatedTarget), so a counter
  // is the only reliable way to know when the pointer has really left the row.
  const dragDepth = useRef(new Map<string, number>())

  // Clear any highlight when a drag ends anywhere, including outside the panel
  useEffect(() => {
    const handleDragEnd = () => {
      dragDepth.current.clear()
      setDropTargetId(null)
    }
    window.addEventListener('dragend', handleDragEnd)
    return () => window.removeEventListener('dragend', handleDragEnd)
  }, [])

  const openFolder = (folderId: string | null) => {
    assets.send({type: 'folder.open', folderId})
  }

  /**
   * Drop handlers for a folder tree item. `folderId` of `null` targets "All assets",
   * which removes the dropped assets from their folder.
   *
   * Events stop propagating so nested folders don't also fire on their ancestors, and so
   * the surrounding upload dropzone never sees them.
   */
  const getDropTargetHandlers = (folderId: string | null): DropTargetHandlers => {
    const targetId = folderId ?? ROOT_DROP_TARGET_ID

    return {
      onDragEnter: (e) => {
        if (!isAssetDrag(e)) return
        e.preventDefault()
        e.stopPropagation()
        const depth = (dragDepth.current.get(targetId) ?? 0) + 1
        dragDepth.current.set(targetId, depth)
        setDropTargetId(targetId)
      },
      onDragOver: (e) => {
        if (!isAssetDrag(e)) return
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'move'
      },
      onDragLeave: (e) => {
        if (!isAssetDrag(e)) return
        e.stopPropagation()
        const depth = (dragDepth.current.get(targetId) ?? 0) - 1
        if (depth > 0) {
          dragDepth.current.set(targetId, depth)
          return
        }
        dragDepth.current.delete(targetId)
        setDropTargetId((current) => (current === targetId ? null : current))
      },
      onDrop: (e) => {
        if (!isAssetDrag(e)) return
        e.preventDefault()
        e.stopPropagation()
        dragDepth.current.clear()
        setDropTargetId(null)

        const {byIds} = assets.getSnapshot().context
        const droppedAssets = getDragAssetIds(e)
          .map((assetId) => byIds[assetId])
          .filter((item): item is AssetItem => Boolean(item))
          // Skip assets already in the target folder
          .filter((item) => (item.asset.opt?.media?.folder?._ref ?? null) !== folderId)

        if (droppedAssets.length === 0) return

        assets.send({type: 'assets.folder.set', assets: droppedAssets, folderId})
      },
    }
  }

  const handleFolderDelete = () => {
    if (!currentFolderId || !currentFolder) {
      return
    }

    dialogs.send({
      type: 'dialog.open',
      dialog: confirmDeleteFolderDialog(currentFolderId, currentFolder.name),
    })
  }

  return (
    <Flex direction="column" flex={1} height="fill">
      <Flex
        align="center"
        justify="space-between"
        paddingX={3}
        style={{
          borderBottom: '1px solid var(--card-border-color)',
          flexShrink: 0,
          height: `${PANEL_HEIGHT}px`,
        }}
      >
        <Box flex={1}>
          <Inline gap={2}>
            <Label size={0}>Folders</Label>
            {fetching && (
              <Label size={0} style={{opacity: 0.3}}>
                Loading...
              </Label>
            )}
          </Inline>
        </Box>

        <Inline gap={1}>
          {currentFolderId && (
            <FolderHeaderAction
              icon={<EditIcon />}
              onClick={() =>
                dialogs.send({type: 'dialog.open', dialog: folderRenameDialog(currentFolderId)})
              }
              tone="primary"
              tooltip="Rename folder"
            />
          )}

          <FolderHeaderAction
            icon={<AddIcon />}
            onClick={() =>
              dialogs.send({type: 'dialog.open', dialog: folderCreateDialog(currentFolderId)})
            }
            tone="primary"
            tooltip="Create folder"
          />

          {currentFolderId && (
            <FolderHeaderAction
              icon={<TrashIcon />}
              onClick={handleFolderDelete}
              tone="critical"
              tooltip="Delete folder"
            />
          )}
        </Inline>
      </Flex>

      <Box padding={2}>
        <Box>
          <DropTree gap={1} key={treeKey}>
            <TreeItem
              data-drop-target={dropTargetId === ROOT_DROP_TARGET_ID ? '' : undefined}
              id={ROOT_DROP_TARGET_ID}
              onClick={() => openFolder(null)}
              selected={currentFolderId === null}
              text="All assets"
              weight={currentFolderId === null ? 'semibold' : 'medium'}
              {...getDropTargetHandlers(null)}
            />

            {folderTree.map((node) => (
              <FolderNode
                currentFolderId={currentFolderId}
                dropTargetId={dropTargetId}
                expandedIds={expandedIds}
                getDropTargetHandlers={getDropTargetHandlers}
                key={node.id}
                node={node}
                onSelect={openFolder}
              />
            ))}
          </DropTree>

          {!hasFolders && !fetching && (
            <Box marginTop={3} paddingX={1}>
              <Text muted size={1}>
                <em>No folders</em>
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </Flex>
  )
}

export default FolderView
