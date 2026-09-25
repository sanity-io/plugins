import type {ClientError, SanityClient} from '@sanity/client'
import {
  type ActorRefFrom,
  assertEvent,
  assign,
  enqueueActions,
  sendParent,
  setup,
  type SnapshotFrom,
} from 'xstate'

import {ORDER_OPTIONS} from '../constants'
import type {
  Asset,
  AssetItem,
  AssetType,
  BrowserView,
  HttpError,
  Order,
  SearchFacetInputProps,
  Tag,
} from '../types'
import {isImageAsset} from '../utils/typeGuards'
import {
  buildAssetsFilter,
  buildAssetsQuery,
  deleteAssets,
  fetchAssets,
  moveAssets,
  replaceReferences,
  tagAssets,
  updateAsset,
  verifyUploads,
} from './assetsActors'
import {
  addSearchFacet,
  isTagSearchFacet,
  removeSearchFacet,
  removeTagSearchFacets,
  renameTagSearchFacets,
  type SearchFacet,
  type SearchFacetUpdate,
  updateSearchFacetById,
  updateSearchFacetByName,
} from './searchFacets'
import {createSelector, toHttpError} from './utils'

const DEFAULT_ORDER: Order = ORDER_OPTIONS.find((option) => option !== null) ?? {
  direction: 'desc',
  field: '_createdAt',
}

export type TagOperation = 'add' | 'remove'

type AssetMutation =
  | {kind: 'update'; asset: Asset; closeDialogId?: string; formData: Record<string, unknown>}
  | {kind: 'delete'; assets: Asset[]}
  | {kind: 'tag'; assets: AssetItem[]; operation: TagOperation; tag: Tag}
  | {kind: 'move'; assets: AssetItem[]; closeDialogId?: string; folderId: string | null}

type BrowseScope = Pick<AssetsContext, 'currentFolderId' | 'searchFacets' | 'searchQuery'>

export type AssetListenerEvent = {
  documentId: string
  result?: Asset
  transition: 'appear' | 'disappear' | 'update'
}

export type AssetsInput = {
  /** Restricts every fetch to a single asset (used by the edit asset source). */
  assetId?: string
  assetTypes: AssetType[]
  client: SanityClient
  documentAssetIds: string[]
  documentId?: string
  excludeTagSlugs: string[]
  pageSize?: number
  showMediaLibraryAssets: boolean
}

export type AssetsContext = Omit<AssetsInput, 'pageSize'> & {
  // Browse query
  currentFolderId: string | null
  order: Order
  searchFacets: SearchFacet[]
  searchQuery: string
  view: BrowserView
  // Asset list
  allIds: string[]
  byIds: Record<string, AssetItem>
  /**
   * Number of items retrieved by the most recent page fetch, or -1 before the first one.
   * Counting all matching assets upfront is too slow on large datasets, so a short page is what
   * signals that there are no more assets to load.
   */
  fetchCount: number
  fetchingError: HttpError | undefined
  lastPicked: string | undefined
  pageIndex: number
  pageSize: number
  /** Set while the replace dialog is open, with any browse scope that was cleared for it. */
  replace: {assetId: string; savedScope?: BrowseScope} | undefined
  // Work queues
  listenerEvents: AssetListenerEvent[]
  mutations: AssetMutation[]
  referenceReplacements: {asset: Asset; targetId: string}[]
  uploadedAssets: Asset[]
}

export type AssetsEvent =
  | {type: 'load'}
  | {type: 'load.more'}
  | {type: 'folder.open'; folderId: string | null}
  | {type: 'order.set'; order: Order}
  | {type: 'view.set'; view: BrowserView}
  | {type: 'search.query.set'; query: string}
  | {type: 'search.facet.add'; facet: SearchFacetInputProps}
  | {type: 'search.facet.remove'; facetId: string}
  | {type: 'search.facet.update'; facetId: string; update: SearchFacetUpdate}
  | {type: 'search.facet.updateByName'; name: string; update: SearchFacetUpdate}
  | {type: 'search.facets.clear'}
  | {type: 'search.facets.set'; facets: SearchFacetInputProps[]}
  | {type: 'search.tag.remove'; tagId: string}
  | {type: 'pick.toggle'; assetId: string}
  | {type: 'pick.range'; assetId: string}
  | {type: 'pick.all'}
  | {type: 'pick.clear'}
  | {type: 'asset.update'; asset: Asset; closeDialogId?: string; formData: Record<string, unknown>}
  | {type: 'assets.delete'; assets: Asset[]}
  | {type: 'assets.tag.add'; assets: AssetItem[]; tag: Tag}
  | {type: 'assets.tag.remove'; assets: AssetItem[]; tag: Tag}
  | {
      type: 'assets.folder.set'
      assets: AssetItem[]
      closeDialogId?: string
      folderId: string | null
    }
  | {type: 'asset.references.replace'; asset: Asset; targetId: string}
  | {type: 'replace.start'; assetId: string}
  | {type: 'replace.end'}
  | ({type: 'listener.mutation'} & AssetListenerEvent)
  | {type: 'upload.completed'; asset: Asset}
  | {type: 'folders.synced'; folderIds: string[]}
  | {type: 'folder.deleted'; folderId: string}
  | {type: 'tag.renamed'; tag: Tag}

/** Events reported to the parent actor, which coordinates the rest of the browser. */
export type AssetsReport =
  | {type: 'assets.fetchFailed'; error: HttpError}
  | {type: 'asset.updated'; asset: Asset; closeDialogId?: string | undefined}
  | {type: 'asset.updateFailed'; error: HttpError}
  | {type: 'assets.deleted'; assetIds: string[]}
  | {type: 'assets.deleteFailed'; assetIds: string[]}
  | {type: 'assets.tagged'; assets: AssetItem[]; operation: TagOperation; tag: Tag}
  | {type: 'assets.taggingFailed'; tag: Tag}
  | {type: 'assets.moved'; closeDialogId?: string | undefined}
  | {type: 'assets.moveFailed'; error: HttpError}
  | {type: 'assets.synced'}
  | {type: 'uploads.verified'; hashes: string[]}

type ItemError = {description: string; id: string}

function updateItems(
  byIds: Record<string, AssetItem>,
  ids: Iterable<string>,
  update: (item: AssetItem) => AssetItem,
): Record<string, AssetItem> {
  let next: Record<string, AssetItem> | undefined
  for (const id of ids) {
    const item = byIds[id]
    if (item) {
      next ??= {...byIds}
      next[id] = update(item)
    }
  }
  return next ?? byIds
}

function removeItems(context: AssetsContext, ids: string[]) {
  const removed = new Set(ids)
  const byIds = {...context.byIds}
  for (const id of removed) {
    delete byIds[id]
  }
  return {allIds: context.allIds.filter((id) => !removed.has(id)), byIds}
}

function markUpdating(byIds: Record<string, AssetItem>, ids: Iterable<string>) {
  return updateItems(byIds, ids, (item) => ({...item, updating: true}))
}

function markSettled(byIds: Record<string, AssetItem>, ids: Iterable<string>, error?: string) {
  return updateItems(byIds, ids, ({error: _previousError, ...item}) => ({
    ...item,
    updating: false,
    ...(error ? {error} : {}),
  }))
}

function sortAssetIds(allIds: string[], byIds: Record<string, AssetItem>, order: Order) {
  const valueOf = (id: string) => byIds[id]?.asset[order.field] as number | string
  return allIds.toSorted((a, b) => {
    const valueA = valueOf(a)
    const valueB = valueOf(b)
    if (valueA < valueB) {
      return order.direction === 'asc' ? -1 : 1
    }
    if (valueA > valueB) {
      return order.direction === 'asc' ? 1 : -1
    }
    return 0
  })
}

function hasBrowseScope(context: AssetsContext) {
  return (
    context.searchQuery.length > 0 ||
    context.searchFacets.length > 0 ||
    context.currentFolderId !== null
  )
}

function assetIdsOf(items: AssetItem[]) {
  return items.map((item) => item.asset._id)
}

function nextMutation<TKind extends AssetMutation['kind']>(context: AssetsContext, kind: TKind) {
  const mutation = context.mutations[0]
  if (mutation?.kind !== kind) {
    throw new Error(`Expected a queued "${kind}" asset mutation`)
  }
  return mutation as Extract<AssetMutation, {kind: TKind}>
}

function currentFilter(context: AssetsContext) {
  return buildAssetsFilter({
    ...(context.assetId ? {assetId: context.assetId} : {}),
    assetTypes: context.assetTypes,
    currentFolderId: context.currentFolderId,
    documentAssetIds: context.documentAssetIds,
    ...(context.documentId ? {documentId: context.documentId} : {}),
    excludeTagSlugs: context.excludeTagSlugs,
    searchFacets: context.searchFacets,
    searchQuery: context.searchQuery,
    showMediaLibraryAssets: context.showMediaLibraryAssets,
  })
}

/**
 * The asset browser: the browse query (search, facets, folder and order), the paged asset list,
 * picked assets, and every mutation of assets. Changing the query always resets the list and
 * refetches it from the first page; search changes are debounced first.
 */
export const assetsMachine = setup({
  types: {} as {
    context: AssetsContext
    events: AssetsEvent
    input: AssetsInput
  },
  actors: {
    'delete assets': deleteAssets,
    'fetch assets': fetchAssets,
    'move assets': moveAssets,
    'replace references': replaceReferences,
    'tag assets': tagAssets,
    'update asset': updateAsset,
    'verify uploads': verifyUploads,
  },
  delays: {
    'listener batch window': 2000,
    'search debounce': 400,
    // Gives the dataset a moment to register freshly uploaded assets before querying them
    'upload verification delay': 1000,
  },
  guards: {
    'browse scope is active': ({context}) => hasBrowseScope(context),
    'current folder is missing': ({context, event}) => {
      assertEvent(event, 'folders.synced')
      return context.currentFolderId !== null && !event.folderIds.includes(context.currentFolderId)
    },
    'current folder was deleted': ({context, event}) => {
      assertEvent(event, 'folder.deleted')
      return context.currentFolderId === event.folderId
    },
    'has more pages': ({context}) => context.fetchCount === context.pageSize,
    'has queued reference replacements': ({context}) => context.referenceReplacements.length > 0,
    'has uploads to verify': ({context}) => context.uploadedAssets.length > 0,
    'needs more replacement candidates': ({context}) => {
      const {replace} = context
      if (!replace || context.fetchingError || context.fetchCount !== context.pageSize) {
        return false
      }
      return !context.allIds.some((id) => {
        const asset = context.byIds[id]?.asset
        return id !== replace.assetId && asset !== undefined && isImageAsset(asset)
      })
    },
    'next mutation is': ({context}, params: {kind: AssetMutation['kind']}) =>
      context.mutations[0]?.kind === params.kind,
    'replace scope was saved': ({context}) => context.replace?.savedScope !== undefined,
  },
  actions: {
    'report': sendParent((_, report: AssetsReport) => report),
    'clear list': assign({allIds: []}),
    'reset page': assign({pageIndex: 0}),
    'next page': assign({pageIndex: ({context}) => context.pageIndex + 1}),
    'clear picks': assign(({context}) => ({
      // Only picked items get new objects, so unpicked cards don't re-render
      byIds: updateItems(
        context.byIds,
        Object.keys(context.byIds).filter((id) => context.byIds[id]?.picked),
        (item) => ({...item, picked: false}),
      ),
      lastPicked: undefined,
    })),
    'set search query': assign({
      searchQuery: ({event}) => {
        assertEvent(event, 'search.query.set')
        return event.query
      },
    }),
    'update search facets': assign({
      searchFacets: ({context, event}) => {
        assertEvent(event, [
          'search.facet.add',
          'search.facet.remove',
          'search.facet.update',
          'search.facet.updateByName',
          'search.facets.clear',
          'search.facets.set',
          'search.tag.remove',
        ])
        switch (event.type) {
          case 'search.facet.add':
            return addSearchFacet(context.searchFacets, event.facet)
          case 'search.facet.remove':
            return removeSearchFacet(context.searchFacets, event.facetId)
          case 'search.facet.update':
            return updateSearchFacetById(context.searchFacets, event.facetId, event.update)
          case 'search.facet.updateByName':
            return updateSearchFacetByName(context.searchFacets, event.name, event.update)
          case 'search.facets.clear':
            return []
          case 'search.facets.set':
            return event.facets.reduce<SearchFacet[]>(addSearchFacet, [])
          case 'search.tag.remove':
            return removeTagSearchFacets(context.searchFacets, event.tagId)
          default: {
            const exhaustive: never = event
            throw new Error(`Unhandled search event ${JSON.stringify(exhaustive)}`)
          }
        }
      },
    }),
    'buffer listener event': assign({
      listenerEvents: ({context, event}) => {
        assertEvent(event, 'listener.mutation')
        const {documentId, result, transition} = event
        return [...context.listenerEvents, {documentId, transition, ...(result ? {result} : {})}]
      },
    }),
    'apply listener events': assign(({context}) => {
      let {allIds, byIds} = context
      for (const {documentId, result, transition} of context.listenerEvents) {
        if (transition === 'disappear') {
          ;({allIds, byIds} = removeItems({...context, allIds, byIds}, [documentId]))
        } else if (result) {
          // Realtime events only refresh assets already in the list
          byIds = updateItems(byIds, [documentId], (item) => ({...item, asset: result}))
        }
      }
      return {
        allIds: sortAssetIds(allIds, byIds, context.order),
        byIds,
        listenerEvents: [],
      }
    }),
  },
}).createMachine({
  id: 'assets',
  type: 'parallel',
  context: ({input}) => ({
    ...(input.assetId ? {assetId: input.assetId} : {}),
    assetTypes: input.assetTypes,
    client: input.client,
    documentAssetIds: input.documentAssetIds,
    ...(input.documentId ? {documentId: input.documentId} : {}),
    excludeTagSlugs: input.excludeTagSlugs,
    showMediaLibraryAssets: input.showMediaLibraryAssets,
    currentFolderId: null,
    order: DEFAULT_ORDER,
    searchFacets: [],
    searchQuery: '',
    view: 'grid',
    allIds: [],
    byIds: {},
    fetchCount: -1,
    fetchingError: undefined,
    lastPicked: undefined,
    pageIndex: 0,
    pageSize: input.pageSize ?? 100,
    replace: undefined,
    listenerEvents: [],
    mutations: [],
    referenceReplacements: [],
    uploadedAssets: [],
  }),
  // A parallel state only falls back to these when no region handles the event
  on: {
    'view.set': {
      actions: [assign({view: ({event}) => event.view}), 'clear picks'],
    },
    'pick.toggle': {
      actions: assign(({context, event}) => {
        const item = context.byIds[event.assetId]
        if (!item) {
          return {}
        }
        const picked = !item.picked
        return {
          byIds: {...context.byIds, [event.assetId]: {...item, picked}},
          lastPicked: picked ? event.assetId : undefined,
        }
      }),
    },
    'pick.range': {
      actions: assign(({context, event}) => {
        const endIndex = context.allIds.indexOf(event.assetId)
        if (endIndex < 0) {
          return {}
        }
        const anchorIndex = context.lastPicked ? context.allIds.indexOf(context.lastPicked) : -1
        const startIndex = anchorIndex < 0 ? endIndex : anchorIndex
        const rangeIds = context.allIds.slice(
          Math.min(startIndex, endIndex),
          Math.max(startIndex, endIndex) + 1,
        )
        return {
          byIds: updateItems(context.byIds, rangeIds, (item) =>
            item.picked ? item : {...item, picked: true},
          ),
          lastPicked: event.assetId,
        }
      }),
    },
    'pick.all': {
      actions: assign({
        byIds: ({context}) =>
          updateItems(context.byIds, context.allIds, (item) =>
            item.picked ? item : {...item, picked: true},
          ),
      }),
    },
    'pick.clear': {actions: 'clear picks'},
    'asset.update': {
      actions: assign(({context, event}) => ({
        byIds: markUpdating(context.byIds, [event.asset._id]),
        mutations: [
          ...context.mutations,
          {
            kind: 'update',
            asset: event.asset,
            formData: event.formData,
            ...(event.closeDialogId ? {closeDialogId: event.closeDialogId} : {}),
          },
        ],
      })),
    },
    'assets.delete': {
      actions: assign(({context, event}) => ({
        // Errors from a previous failed deletion no longer apply
        byIds: markUpdating(
          updateItems(
            context.byIds,
            Object.keys(context.byIds),
            ({error: _error, ...item}) => item,
          ),
          event.assets.map((asset) => asset._id),
        ),
        mutations: [...context.mutations, {kind: 'delete', assets: event.assets}],
      })),
    },
    'assets.tag.add': {
      actions: assign(({context, event}) => ({
        byIds: markUpdating(context.byIds, assetIdsOf(event.assets)),
        mutations: [
          ...context.mutations,
          {kind: 'tag', assets: event.assets, operation: 'add', tag: event.tag},
        ],
      })),
    },
    'assets.tag.remove': {
      actions: assign(({context, event}) => ({
        byIds: markUpdating(context.byIds, assetIdsOf(event.assets)),
        mutations: [
          ...context.mutations,
          {kind: 'tag', assets: event.assets, operation: 'remove', tag: event.tag},
        ],
      })),
    },
    'assets.folder.set': {
      actions: assign(({context, event}) => ({
        byIds: markUpdating(context.byIds, assetIdsOf(event.assets)),
        mutations: [
          ...context.mutations,
          {
            kind: 'move',
            assets: event.assets,
            folderId: event.folderId,
            ...(event.closeDialogId ? {closeDialogId: event.closeDialogId} : {}),
          },
        ],
      })),
    },
    'asset.references.replace': {
      actions: assign(({context, event}) => ({
        byIds: updateItems(context.byIds, [event.targetId], ({error: _error, ...item}) => ({
          ...item,
          updating: true,
        })),
        referenceReplacements: [
          ...context.referenceReplacements,
          {asset: event.asset, targetId: event.targetId},
        ],
      })),
    },
    'upload.completed': {
      actions: assign(({context, event}) => ({
        byIds: {
          ...context.byIds,
          [event.asset._id]: {_type: 'asset', asset: event.asset, picked: false, updating: false},
        },
        uploadedAssets: [...context.uploadedAssets, event.asset],
      })),
    },
    'tag.renamed': {
      actions: assign({
        searchFacets: ({context, event}) => renameTagSearchFacets(context.searchFacets, event.tag),
      }),
    },
  },
  states: {
    fetch: {
      initial: 'idle',
      on: {
        'load': {
          target: '.fetching',
          actions: ['clear list', 'reset page'],
        },
        'folder.open': {
          target: '.fetching',
          actions: [
            assign({currentFolderId: ({event}) => event.folderId}),
            'clear picks',
            'clear list',
            'reset page',
          ],
        },
        'folders.synced': {
          guard: 'current folder is missing',
          target: '.fetching',
          actions: [assign({currentFolderId: null}), 'clear picks', 'clear list', 'reset page'],
        },
        'folder.deleted': {
          guard: 'current folder was deleted',
          target: '.fetching',
          actions: [assign({currentFolderId: null}), 'clear picks', 'clear list', 'reset page'],
        },
        'order.set': {
          target: '.fetching',
          actions: [
            assign({order: ({event}) => event.order}),
            'clear picks',
            'clear list',
            'reset page',
          ],
        },
        'search.query.set': {
          target: '.debouncing',
          actions: ['set search query', 'clear picks'],
        },
        'search.facet.add': {
          target: '.debouncing',
          actions: ['update search facets', 'clear picks'],
        },
        'search.facet.remove': {
          target: '.debouncing',
          actions: ['update search facets', 'clear picks'],
        },
        'search.facet.update': {
          target: '.debouncing',
          actions: ['update search facets', 'clear picks'],
        },
        'search.facet.updateByName': {
          target: '.debouncing',
          actions: ['update search facets', 'clear picks'],
        },
        'search.facets.clear': {
          target: '.debouncing',
          actions: ['update search facets', 'clear picks'],
        },
        'search.facets.set': {
          target: '.debouncing',
          actions: ['update search facets', 'clear picks'],
        },
        'search.tag.remove': {
          target: '.debouncing',
          actions: ['update search facets', 'clear picks'],
        },
        // Replacement candidates are picked from the whole library, so the browse scope is cleared
        // while the replace dialog is open and restored once it closes.
        'replace.start': [
          {
            guard: 'browse scope is active',
            target: '.fetching',
            actions: [
              assign(({context, event}) => ({
                currentFolderId: null,
                replace: {
                  assetId: event.assetId,
                  savedScope: {
                    currentFolderId: context.currentFolderId,
                    searchFacets: context.searchFacets,
                    searchQuery: context.searchQuery,
                  },
                },
                searchFacets: [],
                searchQuery: '',
              })),
              'clear picks',
              'clear list',
              'reset page',
            ],
          },
          {actions: assign({replace: ({event}) => ({assetId: event.assetId})})},
        ],
        'replace.end': [
          {
            guard: 'replace scope was saved',
            target: '.fetching',
            actions: [
              assign(({context}) => ({...context.replace?.savedScope})),
              'clear picks',
              // Clearing the scope unpicked the asset being replaced: keep it selected
              assign(({context}) => {
                const assetId = context.replace?.assetId
                const item = assetId ? context.byIds[assetId] : undefined
                return assetId && item
                  ? {
                      byIds: {...context.byIds, [assetId]: {...item, picked: true}},
                      lastPicked: assetId,
                    }
                  : {}
              }),
              assign({replace: undefined}),
              'clear list',
              'reset page',
            ],
          },
          {actions: assign({replace: undefined})},
        ],
      },
      states: {
        idle: {
          always: {
            guard: 'needs more replacement candidates',
            target: 'fetching',
            actions: 'next page',
          },
          on: {
            'load.more': {guard: 'has more pages', target: 'fetching', actions: 'next page'},
          },
        },
        debouncing: {
          after: {
            'search debounce': {target: 'fetching', actions: ['clear list', 'reset page']},
          },
        },
        fetching: {
          invoke: {
            src: 'fetch assets',
            input: ({context}) => {
              const {filter, params} = currentFilter(context)
              return {
                client: context.client,
                params,
                query: buildAssetsQuery({
                  filter,
                  order: context.order,
                  pageIndex: context.pageIndex,
                  pageSize: context.pageSize,
                }),
              }
            },
            onDone: {
              target: 'idle',
              actions: assign(({context, event}) => {
                const allIds = [...context.allIds]
                const listed = new Set(allIds)
                const byIds = {...context.byIds}
                for (const asset of event.output) {
                  if (!listed.has(asset._id)) {
                    listed.add(asset._id)
                    allIds.push(asset._id)
                  }
                  const existing = byIds[asset._id]
                  // Keep pick/updating/error state across refetches of the same asset
                  byIds[asset._id] = {
                    _type: 'asset',
                    asset,
                    picked: existing?.picked ?? false,
                    updating: existing?.updating ?? false,
                    ...(existing?.error ? {error: existing.error} : {}),
                  }
                }
                return {allIds, byIds, fetchCount: event.output.length, fetchingError: undefined}
              }),
            },
            onError: {
              target: 'idle',
              actions: [
                assign({fetchingError: ({event}) => toHttpError(event.error)}),
                {
                  type: 'report',
                  params: ({event}) => ({
                    type: 'assets.fetchFailed',
                    error: toHttpError(event.error),
                  }),
                },
              ],
            },
          },
        },
      },
    },
    mutations: {
      initial: 'idle',
      states: {
        idle: {
          always: [
            {guard: {type: 'next mutation is', params: {kind: 'update'}}, target: 'updating'},
            {guard: {type: 'next mutation is', params: {kind: 'delete'}}, target: 'deleting'},
            {guard: {type: 'next mutation is', params: {kind: 'tag'}}, target: 'tagging'},
            {guard: {type: 'next mutation is', params: {kind: 'move'}}, target: 'moving'},
          ],
        },
        updating: {
          invoke: {
            src: 'update asset',
            input: ({context}) => {
              const {asset, formData} = nextMutation(context, 'update')
              return {asset, client: context.client, formData}
            },
            onDone: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                const {closeDialogId} = nextMutation(context, 'update')
                const asset = event.output
                const byIds = updateItems(context.byIds, [asset._id], (item) => ({
                  ...item,
                  asset,
                  updating: false,
                }))
                enqueue.assign({
                  allIds: sortAssetIds(context.allIds, byIds, context.order),
                  byIds,
                  mutations: context.mutations.slice(1),
                })
                enqueue({type: 'report', params: {type: 'asset.updated', asset, closeDialogId}})
              }),
            },
            onError: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                const {asset} = nextMutation(context, 'update')
                const error = toHttpError(event.error)
                enqueue.assign({
                  byIds: markSettled(context.byIds, [asset._id], error.message),
                  mutations: context.mutations.slice(1),
                })
                enqueue({type: 'report', params: {type: 'asset.updateFailed', error}})
              }),
            },
          },
        },
        deleting: {
          invoke: {
            src: 'delete assets',
            input: ({context}) => ({
              assetIds: nextMutation(context, 'delete').assets.map((asset) => asset._id),
              client: context.client,
            }),
            onDone: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue}) => {
                const assetIds = nextMutation(context, 'delete').assets.map((asset) => asset._id)
                const {allIds, byIds} = removeItems(context, assetIds)
                enqueue.assign({
                  allIds,
                  byIds,
                  mutations: context.mutations.slice(1),
                  pageIndex: Math.floor(allIds.length / context.pageSize) - 1,
                })
                enqueue({type: 'report', params: {type: 'assets.deleted', assetIds}})
                if (allIds.length === 0) {
                  enqueue.raise({type: 'load'})
                }
              }),
            },
            onError: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                const assetIds = nextMutation(context, 'delete').assets.map((asset) => asset._id)
                const itemErrors: ItemError[] =
                  (event.error as ClientError | undefined)?.response?.body?.error?.items?.map(
                    (item: {error: ItemError}) => item.error,
                  ) ?? []
                let byIds = markSettled(context.byIds, assetIds)
                for (const itemError of itemErrors) {
                  byIds = updateItems(byIds, [itemError.id], (item) => ({
                    ...item,
                    error: itemError.description,
                  }))
                }
                enqueue.assign({byIds, mutations: context.mutations.slice(1)})
                enqueue({type: 'report', params: {type: 'assets.deleteFailed', assetIds}})
              }),
            },
          },
        },
        tagging: {
          invoke: {
            src: 'tag assets',
            input: ({context}) => {
              const {assets, operation, tag} = nextMutation(context, 'tag')
              return {
                // Prefer the latest revision of each asset over the one captured on request
                assets: assets.map((item) => context.byIds[item.asset._id] ?? item),
                client: context.client,
                operation,
                tag,
              }
            },
            onDone: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue}) => {
                const {assets, operation, tag} = nextMutation(context, 'tag')
                enqueue.assign({
                  byIds: markSettled(context.byIds, assetIdsOf(assets)),
                  mutations: context.mutations.slice(1),
                })
                enqueue({type: 'report', params: {type: 'assets.tagged', assets, operation, tag}})
              }),
            },
            onError: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue}) => {
                const {assets, tag} = nextMutation(context, 'tag')
                enqueue.assign({
                  byIds: markSettled(context.byIds, assetIdsOf(assets)),
                  mutations: context.mutations.slice(1),
                })
                enqueue({type: 'report', params: {type: 'assets.taggingFailed', tag}})
              }),
            },
          },
        },
        moving: {
          invoke: {
            src: 'move assets',
            input: ({context}) => {
              const {assets, folderId} = nextMutation(context, 'move')
              return {
                assets: assets.map((item) => context.byIds[item.asset._id] ?? item),
                client: context.client,
                folderId,
              }
            },
            onDone: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue}) => {
                const {assets, closeDialogId, folderId} = nextMutation(context, 'move')
                enqueue.assign({
                  byIds: updateItems(context.byIds, assetIdsOf(assets), (item) => {
                    const {folder: _folder, ...media} = item.asset.opt?.media ?? {}
                    return {
                      ...item,
                      asset: {
                        ...item.asset,
                        opt: {
                          ...item.asset.opt,
                          media: folderId
                            ? {...media, folder: {_ref: folderId, _type: 'reference', _weak: true}}
                            : media,
                        },
                      },
                      updating: false,
                    }
                  }),
                  mutations: context.mutations.slice(1),
                })
                enqueue({type: 'report', params: {type: 'assets.moved', closeDialogId}})
                // The moved assets may no longer match the browse scope
                enqueue('clear picks')
                enqueue.raise({type: 'load'})
              }),
            },
            onError: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                const {assets} = nextMutation(context, 'move')
                const error = toHttpError(event.error)
                enqueue.assign({
                  byIds: markSettled(context.byIds, assetIdsOf(assets), error.message),
                  mutations: context.mutations.slice(1),
                })
                enqueue({type: 'report', params: {type: 'assets.moveFailed', error}})
              }),
            },
          },
        },
      },
    },
    // Reference replacements can take minutes, so they queue separately from other mutations
    references: {
      initial: 'idle',
      states: {
        idle: {
          always: {guard: 'has queued reference replacements', target: 'replacing'},
        },
        replacing: {
          invoke: {
            src: 'replace references',
            input: ({context}) => ({
              ...context.referenceReplacements[0]!,
              client: context.client,
            }),
            onDone: {
              target: 'idle',
              actions: assign(({context}) => ({
                byIds: markSettled(context.byIds, [context.referenceReplacements[0]!.targetId]),
                referenceReplacements: context.referenceReplacements.slice(1),
              })),
            },
            onError: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                // The spinner and error belong to the asset being replaced
                const error = toHttpError(event.error)
                enqueue.assign({
                  byIds: markSettled(
                    context.byIds,
                    [context.referenceReplacements[0]!.targetId],
                    error.message,
                  ),
                  referenceReplacements: context.referenceReplacements.slice(1),
                })
                enqueue({type: 'report', params: {type: 'asset.updateFailed', error}})
              }),
            },
          },
        },
      },
    },
    realtime: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            'listener.mutation': {target: 'batching', actions: 'buffer listener event'},
          },
        },
        batching: {
          on: {
            'listener.mutation': {actions: 'buffer listener event'},
          },
          after: {
            'listener batch window': {
              target: 'idle',
              actions: ['apply listener events', {type: 'report', params: {type: 'assets.synced'}}],
            },
          },
        },
      },
    },
    uploads: {
      initial: 'idle',
      states: {
        idle: {
          always: {guard: 'has uploads to verify', target: 'waiting'},
        },
        waiting: {
          after: {'upload verification delay': 'verifying'},
        },
        verifying: {
          invoke: {
            src: 'verify uploads',
            input: ({context}) => ({
              ...currentFilter(context),
              assetIds: context.uploadedAssets.map((asset) => asset._id),
              client: context.client,
            }),
            onDone: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                const verified = new Set(event.output.assetIds)
                const listed = new Set(context.allIds)
                const inserted = event.output.matchingIds.filter((id) => !listed.has(id))
                enqueue.assign({
                  allIds: sortAssetIds(
                    [...context.allIds, ...inserted],
                    context.byIds,
                    context.order,
                  ),
                  uploadedAssets: context.uploadedAssets.filter(
                    (asset) => !verified.has(asset._id),
                  ),
                })
                enqueue({
                  type: 'report',
                  params: {
                    type: 'uploads.verified',
                    hashes: context.uploadedAssets
                      .filter((asset) => verified.has(asset._id))
                      .map((asset) => asset.sha1hash),
                  },
                })
              }),
            },
            onError: {
              target: 'idle',
              // The uploads succeeded: stop showing them as in progress, they appear on the next fetch
              actions: enqueueActions(({context, enqueue}) => {
                enqueue.assign({uploadedAssets: []})
                enqueue({
                  type: 'report',
                  params: {
                    type: 'uploads.verified',
                    hashes: context.uploadedAssets.map((asset) => asset.sha1hash),
                  },
                })
              }),
            },
          },
        },
      },
    },
  },
})

export type AssetsActorRef = ActorRefFrom<typeof assetsMachine>
export type AssetsSnapshot = SnapshotFrom<typeof assetsMachine>

export const selectPickedAssets = createSelector(
  (snapshot: AssetsSnapshot) => [snapshot.context.allIds, snapshot.context.byIds],
  (allIds, byIds): AssetItem[] =>
    allIds.flatMap((id) => {
      const item = byIds[id]
      return item?.picked ? [item] : []
    }),
)

export const selectIsFetching = (snapshot: AssetsSnapshot): boolean =>
  snapshot.matches({fetch: 'fetching'})

export const selectHasMorePages = (snapshot: AssetsSnapshot): boolean =>
  snapshot.context.fetchCount === snapshot.context.pageSize

export const selectIsTagSearchFacet = (snapshot: AssetsSnapshot, tagId: string): boolean =>
  snapshot.context.searchFacets.some((facet) => isTagSearchFacet(facet, tagId))

/** Image assets that can replace the asset targeted by the replace dialog. */
export const selectReplacementCandidateIds = createSelector(
  (snapshot: AssetsSnapshot) => [
    snapshot.context.allIds,
    snapshot.context.byIds,
    snapshot.context.replace?.assetId,
  ],
  (allIds, byIds, targetId): string[] =>
    allIds.filter((id) => {
      const asset = byIds[id]?.asset
      return id !== targetId && asset !== undefined && isImageAsset(asset)
    }),
)
