import type {Patch, SanityClient} from '@sanity/client'
import groq from 'groq'
import {nanoid} from 'nanoid'
import {
  type ActorRefFrom,
  assign,
  enqueueActions,
  fromPromise,
  sendParent,
  setup,
  type SnapshotFrom,
} from 'xstate'

import {FOLDER_DOCUMENT_NAME} from '../constants'
import type {AssetType, FolderDoc, FolderTreeNode, HttpError} from '../types'
import {buildExcludeMediaLibraryFragment, buildExcludeTagsFragment} from '../utils/constructFilter'
import {withBadConnection} from './debugMachine'
import {buildFolderIndex, type FolderIndex, getFolderAncestry} from './folderTree'
import {createHttpError, createSelector, toHttpError} from './utils'

type FolderMutation =
  | {kind: 'create'; name: string; parentId: string | null}
  | {kind: 'rename'; folderId: string; name: string}
  | {kind: 'delete'; folderId: string}

export type FoldersInput = {
  assetTypes: AssetType[]
  client: SanityClient
  excludeTagSlugs: string[]
  showMediaLibraryAssets: boolean
}

export type FoldersContext = FoldersInput &
  FolderIndex & {
    creatingError: HttpError | undefined
    /** Number of folders retrieved by the last fetch, or -1 before it completes. */
    fetchCount: number
    mutations: FolderMutation[]
    panelVisible: boolean
    renameError: HttpError | undefined
  }

export type FoldersEvent =
  | {type: 'fetch'}
  /** Debounced refetch, requested whenever assets or folders may have changed. */
  | {type: 'refresh'}
  | {type: 'folder.create'; name: string; parentId: string | null}
  | {type: 'folder.rename'; folderId: string; name: string}
  | {type: 'folder.delete'; folderId: string}
  | {type: 'creatingError.clear'}
  | {type: 'renameError.clear'}
  | {type: 'panel.visible.set'; visible: boolean}

export type FoldersReport =
  | {type: 'folders.fetched'; folderIds: string[]}
  | {type: 'folders.fetchFailed'; error: HttpError}
  | {type: 'folder.created'; folderId: string}
  | {type: 'folder.createFailed'; error: HttpError}
  | {type: 'folder.renamed'}
  | {type: 'folder.renameFailed'; error: HttpError}
  | {type: 'folder.deleted'; folderId: string}
  | {type: 'folder.deleteFailed'; error: HttpError}

type ClientInput = {client: SanityClient}

const assetDocumentTypes = (assetTypes: AssetType[]) =>
  assetTypes.map((type) => `sanity.${type}Asset`)

const fetchFolders = fromPromise<
  {exactCountByFolderId: Record<string, number>; folders: FolderDoc[]},
  Omit<FoldersInput, 'client'> & ClientInput
>(({input, signal, system}) => withBadConnection(system, signal, () => queryFolders(input, signal)))

async function queryFolders(
  input: Omit<FoldersInput, 'client'> & ClientInput,
  signal: AbortSignal,
) {
  const excludeAssetsClause = [
    buildExcludeTagsFragment(input.excludeTagSlugs),
    buildExcludeMediaLibraryFragment(input.showMediaLibraryAssets),
  ]
    .filter(Boolean)
    .map((fragment) => `&& ${fragment}`)
    .join('\n')
  const result = await input.client.fetch<
    {_id: string; count: number; name?: string; parentId?: string | null}[]
  >(
    groq`*[
      _type == "${FOLDER_DOCUMENT_NAME}"
      && !(_id in path("drafts.**"))
    ] {
      _id,
      name,
      "parentId": parent._ref,
      "count": count(*[
        _type in $assetTypes
        && !(_id in path("drafts.**"))
        && opt.media.folder._ref == ^._id
        ${excludeAssetsClause}
      ])
    }`,
    {assetTypes: assetDocumentTypes(input.assetTypes)},
    {signal},
  )
  return {
    exactCountByFolderId: Object.fromEntries(result.map(({_id, count}) => [_id, count])),
    folders: result.map(({_id, name, parentId}) => ({
      _id,
      name: name || '',
      parentId: parentId || null,
    })),
  }
}

const hasSiblingNamed = (siblings: FolderTreeNode[], name: string) =>
  siblings.some((sibling) => sibling.name.toLowerCase() === name.toLowerCase())

const createFolder = fromPromise<
  string,
  ClientInput & {name: string; parentId: string | null; siblings: FolderTreeNode[]}
>(async ({input, system}) => {
  const name = input.name.trim()
  if (!name) {
    throw createHttpError('Folder name cannot be empty', 400)
  }
  if (hasSiblingNamed(input.siblings, name)) {
    throw createHttpError('A folder with this name already exists here', 409)
  }
  const folderId = `${FOLDER_DOCUMENT_NAME}.${nanoid()}`
  await withBadConnection(system, undefined, () =>
    input.client.create({
      _id: folderId,
      _type: FOLDER_DOCUMENT_NAME,
      name,
      ...(input.parentId ? {parent: {_ref: input.parentId, _type: 'reference', _weak: true}} : {}),
    }),
  )
  return folderId
})

const renameFolder = fromPromise<
  void,
  ClientInput & {folder: FolderTreeNode | undefined; name: string; siblings: FolderTreeNode[]}
>(async ({input, system}) => {
  const {folder} = input
  const name = input.name.trim()
  if (!folder) {
    throw createHttpError('Folder not found', 404)
  }
  if (!name) {
    throw createHttpError('Folder name cannot be empty', 400)
  }
  if (name === folder.name) {
    throw createHttpError('Folder name has not changed', 400)
  }
  if (
    hasSiblingNamed(
      input.siblings.filter((sibling) => sibling.id !== folder.id),
      name,
    )
  ) {
    throw createHttpError('A folder with this name already exists here', 409)
  }
  await withBadConnection(system, undefined, () =>
    input.client.patch(folder.id).set({name}).commit(),
  )
})

/**
 * Deletes only the folder document: its assets stay in the library with their folder assignment
 * cleared, and its direct child folders move up to its parent (or the root).
 */
type DeleteFolderInput = ClientInput & {
  assetTypes: AssetType[]
  childFolderIds: string[]
  folderId: string
  parentId: string | null
}

const deleteFolder = fromPromise<void, DeleteFolderInput>(({input, system}) =>
  withBadConnection(system, undefined, () => removeFolder(input)),
)

async function removeFolder(input: DeleteFolderInput) {
  const {client, folderId, parentId} = input
  const assets = await client.fetch<{_id: string}[]>(
    groq`*[
      _type in $assetTypes
      && !(_id in path("drafts.**"))
      && opt.media.folder._ref == $folderId
    ] {
      _id
    }`,
    {assetTypes: assetDocumentTypes(input.assetTypes), folderId},
  )
  const transaction = client.transaction()
  for (const asset of assets) {
    transaction.patch(asset._id, (patch: Patch) => patch.unset(['opt.media.folder']))
  }
  for (const childFolderId of input.childFolderIds) {
    transaction.patch(childFolderId, (patch: Patch) =>
      parentId
        ? patch.set({parent: {_ref: parentId, _type: 'reference', _weak: true}})
        : patch.unset(['parent']),
    )
  }
  await transaction.delete(folderId).commit()
}

function nextMutation<TKind extends FolderMutation['kind']>(context: FoldersContext, kind: TKind) {
  const mutation = context.mutations[0]
  if (mutation?.kind !== kind) {
    throw new Error(`Expected a queued "${kind}" folder mutation`)
  }
  return mutation as Extract<FolderMutation, {kind: TKind}>
}

const siblingsOf = (context: FoldersContext, parentId: string | null) =>
  parentId ? (context.byId[parentId]?.children ?? []) : context.tree

/** Media folders: the folder tree with asset counts, and folder mutations. */
export const foldersMachine = setup({
  types: {} as {
    context: FoldersContext
    events: FoldersEvent
    input: FoldersInput
  },
  actors: {
    'create folder': createFolder,
    'delete folder': deleteFolder,
    'fetch folders': fetchFolders,
    'rename folder': renameFolder,
  },
  delays: {
    'refresh debounce': 300,
  },
  guards: {
    'next mutation is': ({context}, params: {kind: FolderMutation['kind']}) =>
      context.mutations[0]?.kind === params.kind,
  },
  actions: {
    report: sendParent((_, report: FoldersReport) => report),
  },
}).createMachine({
  id: 'folders',
  type: 'parallel',
  context: ({input}) => ({
    ...input,
    byId: {},
    tree: [],
    creatingError: undefined,
    fetchCount: -1,
    mutations: [],
    panelVisible: false,
    renameError: undefined,
  }),
  on: {
    'folder.create': {
      actions: assign(({context, event}) => ({
        creatingError: undefined,
        mutations: [
          ...context.mutations,
          {kind: 'create', name: event.name, parentId: event.parentId},
        ],
      })),
    },
    'folder.rename': {
      actions: assign(({context, event}) => ({
        mutations: [
          ...context.mutations,
          {kind: 'rename', folderId: event.folderId, name: event.name},
        ],
        renameError: undefined,
      })),
    },
    'folder.delete': {
      actions: assign(({context, event}) => ({
        mutations: [...context.mutations, {kind: 'delete', folderId: event.folderId}],
      })),
    },
    'creatingError.clear': {actions: assign({creatingError: undefined})},
    'renameError.clear': {actions: assign({renameError: undefined})},
    'panel.visible.set': {
      actions: assign({panelVisible: ({event}) => event.visible}),
    },
  },
  states: {
    fetch: {
      initial: 'idle',
      on: {
        fetch: {target: '.fetching'},
        refresh: {target: '.debouncing'},
      },
      states: {
        idle: {},
        debouncing: {
          after: {'refresh debounce': 'fetching'},
        },
        fetching: {
          invoke: {
            src: 'fetch folders',
            input: ({context}) => ({
              assetTypes: context.assetTypes,
              client: context.client,
              excludeTagSlugs: context.excludeTagSlugs,
              showMediaLibraryAssets: context.showMediaLibraryAssets,
            }),
            onDone: {
              target: 'idle',
              actions: [
                assign(({event}) => ({
                  ...buildFolderIndex(event.output.folders, event.output.exactCountByFolderId),
                  fetchCount: event.output.folders.length,
                })),
                {
                  type: 'report',
                  params: ({event}) => ({
                    type: 'folders.fetched',
                    folderIds: event.output.folders.map((folder) => folder._id),
                  }),
                },
              ],
            },
            onError: {
              target: 'idle',
              actions: {
                type: 'report',
                params: ({event}) => ({
                  type: 'folders.fetchFailed',
                  error: toHttpError(event.error),
                }),
              },
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
            {guard: {type: 'next mutation is', params: {kind: 'create'}}, target: 'creating'},
            {guard: {type: 'next mutation is', params: {kind: 'rename'}}, target: 'renaming'},
            {guard: {type: 'next mutation is', params: {kind: 'delete'}}, target: 'deleting'},
          ],
        },
        creating: {
          invoke: {
            src: 'create folder',
            input: ({context}) => {
              const {name, parentId} = nextMutation(context, 'create')
              return {
                client: context.client,
                name,
                parentId,
                siblings: siblingsOf(context, parentId),
              }
            },
            onDone: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                enqueue.assign({mutations: context.mutations.slice(1)})
                enqueue({type: 'report', params: {type: 'folder.created', folderId: event.output}})
                enqueue.raise({type: 'refresh'})
              }),
            },
            onError: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                const error = toHttpError(event.error)
                enqueue.assign({creatingError: error, mutations: context.mutations.slice(1)})
                enqueue({type: 'report', params: {type: 'folder.createFailed', error}})
              }),
            },
          },
        },
        renaming: {
          invoke: {
            src: 'rename folder',
            input: ({context}) => {
              const {folderId, name} = nextMutation(context, 'rename')
              const folder = context.byId[folderId]
              return {
                client: context.client,
                folder,
                name,
                siblings: siblingsOf(context, folder?.parentId ?? null),
              }
            },
            onDone: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue}) => {
                enqueue.assign({mutations: context.mutations.slice(1)})
                enqueue({type: 'report', params: {type: 'folder.renamed'}})
                enqueue.raise({type: 'refresh'})
              }),
            },
            onError: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                const error = toHttpError(event.error)
                enqueue.assign({mutations: context.mutations.slice(1), renameError: error})
                enqueue({type: 'report', params: {type: 'folder.renameFailed', error}})
              }),
            },
          },
        },
        deleting: {
          invoke: {
            src: 'delete folder',
            input: ({context}) => {
              const {folderId} = nextMutation(context, 'delete')
              const folder = context.byId[folderId]
              return {
                assetTypes: context.assetTypes,
                childFolderIds: folder?.children.map((child) => child.id) ?? [],
                client: context.client,
                folderId,
                parentId: folder?.parentId ?? null,
              }
            },
            onDone: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue}) => {
                const {folderId} = nextMutation(context, 'delete')
                enqueue.assign({mutations: context.mutations.slice(1)})
                enqueue({type: 'report', params: {type: 'folder.deleted', folderId}})
                enqueue.raise({type: 'refresh'})
              }),
            },
            onError: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                const error = toHttpError(event.error)
                enqueue.assign({mutations: context.mutations.slice(1)})
                enqueue({type: 'report', params: {type: 'folder.deleteFailed', error}})
              }),
            },
          },
        },
      },
    },
  },
})

export type FoldersActorRef = ActorRefFrom<typeof foldersMachine>
export type FoldersSnapshot = SnapshotFrom<typeof foldersMachine>

export const selectIsFetchingFolders = (snapshot: FoldersSnapshot): boolean =>
  snapshot.matches({fetch: 'fetching'})

export const selectIsCreatingFolder = (snapshot: FoldersSnapshot): boolean =>
  snapshot.context.mutations.some((mutation) => mutation.kind === 'create')

export const selectIsRenamingFolder = (snapshot: FoldersSnapshot): boolean =>
  snapshot.context.mutations.some((mutation) => mutation.kind === 'rename')

export const selectFolderPath = (snapshot: FoldersSnapshot, folderId: string | null): string =>
  (folderId && snapshot.context.byId[folderId]?.path) || ''

const EMPTY_FOLDERS: FolderTreeNode[] = []

export const selectFolderChildren = (
  snapshot: FoldersSnapshot,
  folderId: string | null,
): FolderTreeNode[] => (folderId && snapshot.context.byId[folderId]?.children) || EMPTY_FOLDERS

export const selectFolderAncestry = createSelector(
  (snapshot: FoldersSnapshot, folderId: string | null) => [snapshot.context.byId, folderId],
  getFolderAncestry,
)
