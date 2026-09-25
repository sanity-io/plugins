import type {AttributeSet, Patch, SanityClient, SanityDocument} from '@sanity/client'
import groq from 'groq'
import {nanoid} from 'nanoid'

import type {Asset, AssetItem, AssetType, Order, Tag} from '../types'
import constructFilter from '../utils/constructFilter'
import {findImageAssets} from '../utils/ReplaceImages'
import {withBadConnection} from './debugMachine'
import type {SearchFacet} from './searchFacets'
import {fromMutation, fromRequest} from './utils'

export type AssetsFilterOptions = {
  assetId?: string
  assetTypes: AssetType[]
  currentFolderId: string | null
  documentAssetIds: string[]
  documentId?: string
  excludeTagSlugs: string[]
  searchFacets: SearchFacet[]
  searchQuery: string
  showMediaLibraryAssets: boolean
}

export type AssetsFilter = {
  filter: string
  params: Record<string, unknown>
}

export function buildAssetsFilter(options: AssetsFilterOptions): AssetsFilter {
  const filter = constructFilter({
    assetTypes: options.assetTypes,
    currentFolderId: options.currentFolderId,
    excludeTagSlugs: options.excludeTagSlugs,
    searchFacets: options.searchFacets,
    searchQuery: options.searchQuery,
    showMediaLibraryAssets: options.showMediaLibraryAssets,
  })

  return {
    filter: options.assetId ? `${filter} && _id == $assetId` : filter,
    params: {
      // Document id is missing on pristine / unsaved drafts
      ...(options.documentId ? {documentId: options.documentId} : {}),
      ...(options.assetId ? {assetId: options.assetId} : {}),
      documentAssetIds: options.documentAssetIds,
    },
  }
}

export function buildAssetsQuery({
  filter,
  order,
  pageIndex,
  pageSize,
}: {
  filter: string
  order: Order
  pageIndex: number
  pageSize: number
}): string {
  const start = pageIndex * pageSize
  const end = start + pageSize
  return groq`*[${filter}] {
    _id,
    _type,
    _createdAt,
    _updatedAt,
    altText,
    creditLine,
    description,
    extension,
    metadata {
      dimensions,
      exif,
      image,
      isOpaque,
    },
    mimeType,
    opt {
      media
    },
    originalFilename,
    size,
    source {
      name,
      id,
      url,
    },
    title,
    url
  } | order(${order.field} ${order.direction}) [${start}...${end}]`
}

type ClientInput = {client: SanityClient}

export const fetchAssets = fromRequest<
  Asset[],
  ClientInput & {params: Record<string, unknown>; query: string}
>(({input, signal, system}) =>
  withBadConnection(system, signal, () =>
    input.client.fetch<Asset[]>(input.query, input.params, {signal}),
  ),
)

export const updateAsset = fromMutation<
  Asset,
  ClientInput & {asset: Asset; formData: Record<string, unknown>}
>(({input, system}) =>
  withBadConnection(system, undefined, async () => {
    const updated = await input.client
      .patch(input.asset._id)
      .setIfMissing({opt: {}})
      .setIfMissing({'opt.media': {}})
      .set(input.formData)
      .commit()
    return updated as unknown as Asset
  }),
)

export const deleteAssets = fromMutation<void, ClientInput & {assetIds: string[]}>(
  async ({input}) => {
    await input.client.delete({
      query: groq`*[_id in $assetIds]`,
      params: {assetIds: input.assetIds},
    })
  },
)

const hasTag = (item: AssetItem, tag: Tag) =>
  item.asset.opt?.media?.tags?.some((reference) => reference._ref === tag._id) ?? false

const appendTag = (tag: Tag) => (patch: Patch) =>
  patch
    .setIfMissing({opt: {}})
    .setIfMissing({'opt.media': {}})
    .setIfMissing({'opt.media.tags': []})
    .append('opt.media.tags', [{_key: nanoid(), _ref: tag._id, _type: 'reference', _weak: true}])

const unsetTag = (item: AssetItem, tag: Tag) => (patch: Patch) =>
  patch.ifRevisionId(item.asset._rev).unset([`opt.media.tags[_ref == "${tag._id}"]`])

export const tagAssets = fromMutation<
  void,
  ClientInput & {assets: AssetItem[]; operation: 'add' | 'remove'; tag: Tag}
>(({input, system}) =>
  withBadConnection(system, undefined, async () => {
    const {assets, client, operation, tag} = input
    // Assets which already include the tag are skipped when adding it
    const targets = operation === 'add' ? assets.filter((item) => !hasTag(item, tag)) : assets
    if (targets.length === 0) {
      return
    }
    const transaction = targets.reduce(
      (tx, item) =>
        tx.patch(item.asset._id, operation === 'add' ? appendTag(tag) : unsetTag(item, tag)),
      client.transaction(),
    )
    await transaction.commit()
  }),
)

const setFolder = (item: AssetItem, folderId: string | null) => (patch: Patch) => {
  const nextPatch = patch
    .ifRevisionId(item.asset._rev)
    .setIfMissing({opt: {}})
    .setIfMissing({'opt.media': {}})
  return folderId
    ? nextPatch.set({'opt.media.folder': {_ref: folderId, _type: 'reference', _weak: true}})
    : nextPatch.unset(['opt.media.folder'])
}

export const moveAssets = fromMutation<
  void,
  ClientInput & {assets: AssetItem[]; folderId: string | null}
>(({input, system}) =>
  withBadConnection(system, undefined, async () => {
    const transaction = input.assets.reduce(
      (tx, item) => tx.patch(item.asset._id, setFolder(item, input.folderId)),
      input.client.transaction(),
    )
    await transaction.commit()
  }),
)

/**
 * Re-points every image field referencing `targetId` at `asset`. All referencing documents are
 * patched in one transaction so references are never left split across the old and new asset.
 */
export const replaceReferences = fromMutation<void, ClientInput & {asset: Asset; targetId: string}>(
  ({input, system}) =>
    withBadConnection(system, undefined, async () => {
      const {asset, client, targetId} = input
      const documents = await client.fetch<SanityDocument[]>(groq`*[references($id)]`, {
        id: targetId,
      })

      let patchedCount = 0
      const transaction = documents.reduce((tx, document) => {
        const clonedDocument = JSON.parse(JSON.stringify(document)) as Record<string, unknown>
        const assetsToReplace = findImageAssets(clonedDocument, asset, targetId)
        if (assetsToReplace.length === 0) {
          return tx
        }
        patchedCount += 1
        const patchSet = Object.assign({}, ...assetsToReplace) as AttributeSet
        return tx.patch(document._id, (patch) => patch.ifRevisionId(document._rev).set(patchSet))
      }, client.transaction())

      if (patchedCount > 0) {
        await transaction.commit()
      }
    }),
)

/** Checks which freshly uploaded assets match the current browse filter. */
export const verifyUploads = fromRequest<
  {assetIds: string[]; matchingIds: string[]},
  ClientInput & AssetsFilter & {assetIds: string[]}
>(async ({input, signal}) => {
  const matchingIds = await input.client.fetch<string[]>(
    groq`*[${input.filter} && _id in $uploadedAssetIds]._id`,
    {...input.params, uploadedAssetIds: input.assetIds},
    {signal},
  )
  return {assetIds: input.assetIds, matchingIds}
})
