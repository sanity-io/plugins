import {createSelector} from '@reduxjs/toolkit'

import type {CardAssetData, CardFolderData, CardUploadData} from '../types'
import {selectCurrentFolderChildren} from './folders'
import type {RootReducerState} from './types'

export const selectCombinedItems = createSelector(
  [
    (state: RootReducerState) => state.assets.allIds,
    (state: RootReducerState) => state.uploads.allIds,
    selectCurrentFolderChildren,
  ],
  (assetIds, uploadIds, folderChildren) => {
    const assetItems = assetIds.map((id): CardAssetData => ({id, type: 'asset'}))
    const folderItems = folderChildren.map(
      (folder): CardFolderData => ({
        id: `folder:${folder.id}`,
        folderId: folder.id,
        name: folder.name,
        path: folder.path,
        totalCount: folder.totalCount,
        type: 'folder',
      }),
    )
    const uploadItems = uploadIds.map((id): CardUploadData => ({id, type: 'upload'}))
    const combinedItems: (CardAssetData | CardFolderData | CardUploadData)[] = [
      ...folderItems,
      ...uploadItems,
      ...assetItems,
    ]
    return combinedItems
  },
)
