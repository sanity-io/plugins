import type {AssetItem, FileAsset, ImageAsset, Tag} from '../../types'

export function imageAsset(id: string, overrides: Partial<ImageAsset> = {}): ImageAsset {
  return {
    _createdAt: '2024-01-01T00:00:00Z',
    _id: id,
    _rev: `${id}-rev`,
    _type: 'sanity.imageAsset',
    _updatedAt: '2024-01-01T00:00:00Z',
    metadata: {dimensions: {height: 100, width: 100}, isOpaque: true},
    mimeType: 'image/png',
    originalFilename: `${id}.png`,
    sha1hash: `${id}-hash`,
    size: 1,
    url: `https://cdn.sanity.io/${id}.png`,
    ...overrides,
  } as ImageAsset
}

export function fileAsset(id: string, overrides: Partial<FileAsset> = {}): FileAsset {
  return {
    _createdAt: '2024-01-01T00:00:00Z',
    _id: id,
    _rev: `${id}-rev`,
    _type: 'sanity.fileAsset',
    _updatedAt: '2024-01-01T00:00:00Z',
    extension: 'pdf',
    mimeType: 'application/pdf',
    originalFilename: `${id}.pdf`,
    sha1hash: `${id}-hash`,
    size: 1,
    url: `https://cdn.sanity.io/${id}.pdf`,
    ...overrides,
  } as FileAsset
}

export function assetItem(
  asset: FileAsset | ImageAsset,
  overrides: Partial<AssetItem> = {},
): AssetItem {
  return {_type: 'asset', asset, picked: false, updating: false, ...overrides}
}

export function tag(id: string, name: string): Tag {
  return {
    _createdAt: '2024-01-01T00:00:00Z',
    _id: id,
    _rev: `${id}-rev`,
    _type: 'media.tag',
    _updatedAt: '2024-01-01T00:00:00Z',
    name: {_type: 'slug', current: name},
  }
}

export const tagReference = (tagId: string) => ({
  _key: tagId,
  _ref: tagId,
  _type: 'reference' as const,
  _weak: true,
})

export const folderReference = (folderId: string) => ({
  _ref: folderId,
  _type: 'reference' as const,
  _weak: true,
})
