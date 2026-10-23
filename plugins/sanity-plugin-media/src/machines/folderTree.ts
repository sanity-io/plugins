import type {FolderDoc, FolderTreeNode} from '../types'

export type FolderIndex = {
  byId: Record<string, FolderTreeNode>
  tree: FolderTreeNode[]
}

const compareNames = (a: FolderDoc, b: FolderDoc) =>
  a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'})

function buildFolderPath(folderId: string, docsById: Map<string, FolderDoc>): string {
  const segments: string[] = []
  const seen = new Set<string>()
  let cursor: string | null = folderId
  while (cursor && !seen.has(cursor)) {
    const folder = docsById.get(cursor)
    if (!folder) {
      break
    }
    seen.add(cursor)
    segments.unshift(folder.name)
    cursor = folder.parentId
  }
  return segments.join('/')
}

/**
 * Builds the folder tree (sorted by name) with per-folder asset counts, where `totalCount` also
 * includes nested folders. Folders pointing at an unknown parent are shown at the root.
 */
export function buildFolderIndex(
  folders: FolderDoc[],
  exactCountByFolderId: Record<string, number>,
): FolderIndex {
  const docsById = new Map(folders.map((folder) => [folder._id, folder]))
  const childrenByParentId = new Map<string | null, FolderDoc[]>()
  for (const folder of folders) {
    const parentId = folder.parentId && docsById.has(folder.parentId) ? folder.parentId : null
    childrenByParentId.set(parentId, [...(childrenByParentId.get(parentId) ?? []), folder])
  }

  const byId: Record<string, FolderTreeNode> = {}
  const buildNode = (folder: FolderDoc, parentPath: string): FolderTreeNode => {
    const path = parentPath ? `${parentPath}/${folder.name}` : folder.name
    const children = (childrenByParentId.get(folder._id) ?? [])
      .toSorted(compareNames)
      .map((child) => buildNode(child, path))
    const exactCount = exactCountByFolderId[folder._id] ?? 0
    const node: FolderTreeNode = {
      children,
      exactCount,
      id: folder._id,
      name: folder.name,
      parentId: folder.parentId,
      path,
      totalCount: children.reduce((sum, child) => sum + child.totalCount, exactCount),
    }
    byId[folder._id] = node
    return node
  }
  const tree = (childrenByParentId.get(null) ?? [])
    .toSorted(compareNames)
    .map((root) => buildNode(root, ''))

  // Folders in a parent cycle never reach the root: keep them resolvable by id
  for (const folder of folders) {
    byId[folder._id] ??= {
      children: [],
      exactCount: exactCountByFolderId[folder._id] ?? 0,
      id: folder._id,
      name: folder.name,
      parentId: folder.parentId,
      path: buildFolderPath(folder._id, docsById),
      totalCount: exactCountByFolderId[folder._id] ?? 0,
    }
  }

  return {byId, tree}
}

/** The folder with id `folderId` and its ancestors, from the root down. */
export function getFolderAncestry(
  byId: Record<string, FolderTreeNode>,
  folderId: string | null,
): FolderTreeNode[] {
  const chain: FolderTreeNode[] = []
  const seen = new Set<string>()
  let cursor = folderId
  while (cursor && !seen.has(cursor)) {
    const folder = byId[cursor]
    if (!folder) {
      break
    }
    seen.add(cursor)
    chain.unshift(folder)
    cursor = folder.parentId
  }
  return chain
}
