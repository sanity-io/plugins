import {vi} from 'vitest'

import type {Asset, FolderDoc, Tag} from '../../types'

export type MediaFixtures = {
  assets?: Asset[]
  /** Rejects every fetch of that list with the given error. */
  errors?: {assets?: unknown; folders?: unknown; tags?: unknown}
  folders?: (FolderDoc & {count?: number})[]
  tags?: Tag[]
}

/**
 * A `client.fetch` mock that answers the queries issued by the media actors from fixtures,
 * so tests can render the browser (or drive the machines) against a known dataset.
 */
export function createMediaFetchMock({
  assets = [],
  errors = {},
  folders = [],
  tags = [],
}: MediaFixtures = {}) {
  const answer = (list: keyof typeof errors, result: unknown) =>
    list in errors ? Promise.reject(errors[list]) : Promise.resolve(result)

  return vi.fn((query: string, params: Record<string, unknown> = {}) => {
    // Folder list with asset counts
    if (query.includes('"media.folder"') && query.includes('"count"')) {
      return answer(
        'folders',
        folders.map(({_id, count = 0, name, parentId}) => ({_id, count, name, parentId})),
      )
    }
    // Tag name availability
    if (query.includes('count(*[_type == "media.tag" && name.current == $name])')) {
      const taken = tags.some((tag) => tag.name.current === params['name'])
      return Promise.resolve(taken ? 1 : 0)
    }
    // Tag list
    if (query.includes('"media.tag"') && query.includes('order(name.current asc)')) {
      return answer('tags', tags)
    }
    // Uploaded assets matching the browse filter
    if (query.includes('$uploadedAssetIds')) {
      return Promise.resolve(params['uploadedAssetIds'])
    }
    // Asset pages
    if (query.includes('originalFilename') && query.includes('order(')) {
      const assetId = params['assetId']
      return answer('assets', assetId ? assets.filter((asset) => asset._id === assetId) : assets)
    }
    // Documents or assets referencing something that is being deleted or replaced
    return Promise.resolve([])
  })
}
