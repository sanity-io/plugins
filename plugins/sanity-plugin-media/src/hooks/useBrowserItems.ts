import {useSelector} from '@xstate/react'
import {useMemo} from 'react'

import {useMediaActors} from '../contexts/MediaActorsContext'
import {selectFolderChildren} from '../machines/foldersMachine'
import type {CardAssetData, CardFolderData, CardUploadData, FolderTreeNode} from '../types'

export type BrowserItem = CardAssetData | CardFolderData | CardUploadData

/** Folders of the current folder come first, then uploads in progress, then assets. */
export function combineBrowserItems(
  folders: FolderTreeNode[],
  uploadIds: string[],
  assetIds: string[],
): BrowserItem[] {
  return [
    ...folders.map((folder): CardFolderData => ({
      folderId: folder.id,
      id: `folder:${folder.id}`,
      name: folder.name,
      path: folder.path,
      totalCount: folder.totalCount,
      type: 'folder',
    })),
    ...uploadIds.map((id): CardUploadData => ({id, type: 'upload'})),
    ...assetIds.map((id): CardAssetData => ({id, type: 'asset'})),
  ]
}

export function useBrowserItems(): BrowserItem[] {
  const {assets, folders, uploads} = useMediaActors()
  const assetIds = useSelector(assets, (snapshot) => snapshot.context.allIds)
  const currentFolderId = useSelector(assets, (snapshot) => snapshot.context.currentFolderId)
  const uploadIds = useSelector(uploads, (snapshot) => snapshot.context.allIds)
  const folderChildren = useSelector(folders, (snapshot) =>
    selectFolderChildren(snapshot, currentFolderId),
  )

  return useMemo(
    () => combineBrowserItems(folderChildren, uploadIds, assetIds),
    [assetIds, folderChildren, uploadIds],
  )
}
