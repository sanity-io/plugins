import pluralize from 'pluralize'

import type {
  AssetItem,
  DialogAllAssetsProps,
  DialogAssetEditProps,
  DialogConfirmProps,
  DialogFolderCreateProps,
  DialogFolderMoveProps,
  DialogFolderRenameProps,
  DialogFoldersProps,
  DialogSearchFacetsProps,
  DialogTagCreateProps,
  DialogTagEditProps,
  DialogTagsProps,
  Tag,
} from '../types'

const assetCount = (count: number) => `${count} ${pluralize('asset', count)}`

export const assetEditDialog = (assetId: string): DialogAssetEditProps => ({
  assetId,
  id: assetId,
  type: 'assetEdit',
})

export const replaceAssetDialog = (assetId: string): DialogAllAssetsProps => ({
  assetId,
  id: 'dialogAllAssets',
  type: 'dialogAllAssets',
})

export const foldersDialog = (): DialogFoldersProps => ({id: 'folders', type: 'folders'})

export const searchFacetsDialog = (): DialogSearchFacetsProps => ({
  id: 'searchFacets',
  type: 'searchFacets',
})

export const tagsDialog = (): DialogTagsProps => ({id: 'tags', type: 'tags'})

export const tagCreateDialog = (): DialogTagCreateProps => ({id: 'tagCreate', type: 'tagCreate'})

export const tagEditDialog = (tagId: string): DialogTagEditProps => ({
  id: tagId,
  tagId,
  type: 'tagEdit',
})

export const folderCreateDialog = (parentFolderId: string | null): DialogFolderCreateProps => ({
  id: 'folderCreate',
  parentFolderId,
  type: 'folderCreate',
})

export const folderMoveDialog = (
  assets: AssetItem[],
  folderId: string | null,
): DialogFolderMoveProps => ({
  assets,
  folderId,
  id: 'folderMove',
  type: 'folderMove',
})

export const folderRenameDialog = (folderId: string): DialogFolderRenameProps => ({
  folderId,
  id: 'folderRename',
  type: 'folderRename',
})

export function confirmAddTagDialog(assets: AssetItem[], tag: Tag): DialogConfirmProps {
  return {
    confirmEvent: {type: 'assets.tag.add', assets, tag},
    confirmText: `Yes, add tag to ${assetCount(assets.length)}`,
    headerTitle: 'Confirm tag addition',
    id: 'confirm',
    title: `Add tag ${tag.name.current} to ${assetCount(assets.length)}?`,
    tone: 'primary',
    type: 'confirm',
  }
}

export function confirmRemoveTagDialog(assets: AssetItem[], tag: Tag): DialogConfirmProps {
  return {
    confirmEvent: {type: 'assets.tag.remove', assets, tag},
    confirmText: `Yes, remove tag from ${assetCount(assets.length)}`,
    headerTitle: 'Confirm tag removal',
    id: 'confirm',
    title: `Remove tag ${tag.name.current} from ${assetCount(assets.length)}?`,
    tone: 'critical',
    type: 'confirm',
  }
}

export function confirmDeleteAssetsDialog(
  assets: AssetItem[],
  closeDialogId?: string,
): DialogConfirmProps {
  return {
    ...(closeDialogId ? {closeDialogId} : {}),
    confirmEvent: {type: 'assets.delete', assets: assets.map((item) => item.asset)},
    confirmText: `Yes, delete ${assetCount(assets.length)}`,
    description: 'This operation cannot be reversed. Are you sure you want to continue?',
    headerTitle: 'Confirm deletion',
    id: 'confirm',
    title: `Permanently delete ${assetCount(assets.length)}?`,
    tone: 'critical',
    type: 'confirm',
  }
}

export function confirmDeleteFolderDialog(
  folderId: string,
  folderName: string,
): DialogConfirmProps {
  return {
    confirmEvent: {type: 'folder.delete', folderId},
    confirmText: 'Yes, delete folder',
    description:
      'This deletes only the selected folder. Assets in this folder will stay in the library and have their folder assignment removed. Nested folders will move up one level.',
    headerTitle: 'Confirm folder deletion',
    id: 'confirm',
    title: `Delete ${folderName}?`,
    tone: 'critical',
    type: 'confirm',
  }
}

export function confirmDeleteTagDialog(tag: Tag, closeDialogId?: string): DialogConfirmProps {
  return {
    ...(closeDialogId ? {closeDialogId} : {}),
    confirmEvent: {type: 'tag.delete', tag},
    confirmText: 'Yes, delete tag',
    description: 'This operation cannot be reversed. Are you sure you want to continue?',
    headerTitle: 'Confirm deletion',
    id: 'confirm',
    title: 'Permanently delete tag?',
    tone: 'critical',
    type: 'confirm',
  }
}
