import type {SanityClient, SanityDocument} from '@sanity/client'
import pluralize from 'pluralize'
import {
  type ActorRefFrom,
  assign,
  enqueueActions,
  forwardTo,
  sendTo,
  setup,
  type SnapshotFrom,
} from 'xstate'

import {inputs} from '../config/searchFacets'
import type {
  AssetType,
  ConfirmEvent,
  Dialog,
  HttpError,
  SearchFacetInputSearchableProps,
  Tag,
} from '../types'
import getDocumentAssetIds from '../utils/getDocumentAssetIds'
import {type AssetsActorRef, assetsMachine, type AssetsReport} from './assetsMachine'
import {type DebugActorRef, debugMachine} from './debugMachine'
import {assetEditDialog} from './dialogs'
import {type DialogsActorRef, dialogsMachine, type DialogsReport} from './dialogsMachine'
import {type FoldersActorRef, foldersMachine, type FoldersReport} from './foldersMachine'
import {type ListenerEvent, listenToAssets, listenToFolders, listenToTags} from './listeners'
import {type TagsActorRef, tagsMachine, type TagsReport} from './tagsMachine'
import {type UploadsActorRef, uploadsMachine, type UploadsReport} from './uploadsMachine'

export type Notification = {
  status: 'error' | 'info' | 'success' | 'warning'
  title: string
}

export type MediaMode =
  /** The asset browser, used by the Media tool and the asset source picker. */
  | {type: 'browser'; mediaTagNames: string[]}
  /** Only the edit dialog of an already selected asset. */
  | {type: 'editAsset'; assetId: string | undefined}

export type MediaInput = {
  assetTypes: AssetType[]
  client: SanityClient
  /** The document the asset source was opened from, if any. */
  document?: SanityDocument | undefined
  excludeTagSlugs: string[]
  mode: MediaMode
  selectedAssetIds: string[]
  showMediaLibraryAssets: boolean
}

/** Static configuration read by components. */
export type MediaConfig = {
  assetTypes: AssetType[]
  document: SanityDocument | undefined
  selectedAssetIds: string[]
}

export type MediaContext = {
  client: SanityClient
  config: MediaConfig
  mode: MediaMode
  showMediaLibraryAssets: boolean
  /** Updates are batched into a single notification. */
  updatedAssetCount: number
  assets: AssetsActorRef
  debug: DebugActorRef
  dialogs: DialogsActorRef
  folders: FoldersActorRef
  tags: TagsActorRef
  uploads: UploadsActorRef
}

export type MediaEvent =
  | ConfirmEvent
  | {type: 'uploads.add'; files: File[]}
  | {type: 'updatedAssets.notify'}
  | ListenerEvent
  | AssetsReport
  | DialogsReport
  | FoldersReport
  | TagsReport
  | UploadsReport

const errorNotification = (error: HttpError): Notification => ({
  status: 'error',
  title: `An error occurred: ${error.message}`,
})

const isDialogOfType = (dialog: Dialog, type: Dialog['type']) => dialog.type === type

const replaceTargetOf = (dialog: Dialog) =>
  dialog.type === 'dialogAllAssets' ? dialog.assetId : ''

function mediaTagFacets(mediaTagNames: string[], tags: Tag[]): SearchFacetInputSearchableProps[] {
  const tagFacet = inputs.tag
  if (tagFacet.type !== 'searchable') {
    return []
  }
  return mediaTagNames.flatMap((name) => {
    const tag = tags.find((candidate) => candidate.name.current === name)
    return tag
      ? [
          {
            ...tagFacet,
            operatorType: 'references',
            value: {label: tag.name.current, value: tag._id},
          },
        ]
      : []
  })
}

/**
 * The root of the media browser. It spawns an actor per concern (assets, tags, folders, uploads
 * and dialogs), subscribes to realtime changes while browsing, and coordinates the actors: they
 * report what happened, and this machine decides what that means for the others (for instance
 * closing a dialog once its changes are saved, or refreshing folder counts after assets change).
 */
export const mediaMachine = setup({
  types: {} as {
    context: MediaContext
    events: MediaEvent
    input: MediaInput
  },
  actors: {
    'assets': assetsMachine,
    'debug': debugMachine,
    'dialogs': dialogsMachine,
    'folders': foldersMachine,
    'listen to assets': listenToAssets,
    'listen to folders': listenToFolders,
    'listen to tags': listenToTags,
    'tags': tagsMachine,
    'uploads': uploadsMachine,
  },
  delays: {
    'update notification batch window': 2000,
  },
  guards: {
    'has media tags': ({context}) =>
      context.mode.type === 'browser' && context.mode.mediaTagNames.length > 0,
    'is editing an asset': ({context}) =>
      context.mode.type === 'editAsset' && context.mode.assetId !== undefined,
    'has nothing to edit': ({context}) =>
      context.mode.type === 'editAsset' && context.mode.assetId === undefined,
    'dialog is': ({event}, params: {type: Dialog['type']}) =>
      (event.type === 'dialog.opened' || event.type === 'dialog.closed') &&
      isDialogOfType(event.dialog, params.type),
  },
  actions: {
    /** Provided by the React provider to show toasts. */
    'notify': (_, _notification: Notification) => undefined,
    /** Provided by the edit asset source to close itself. */
    'close': () => undefined,
    'refresh folders': sendTo(({context}) => context.folders, {type: 'refresh'}),
    /** Dialogs that aren't open are ignored, so saved changes can pass an optional dialog id. */
    'close dialog': sendTo(
      ({context}) => context.dialogs,
      (_, params: {id: string | undefined}) => ({type: 'dialog.close', id: params.id ?? ''}),
    ),
  },
}).createMachine({
  id: 'media',
  context: ({input, spawn}) => ({
    client: input.client,
    config: {
      assetTypes: input.assetTypes,
      document: input.document,
      selectedAssetIds: input.selectedAssetIds,
    },
    mode: input.mode,
    showMediaLibraryAssets: input.showMediaLibraryAssets,
    updatedAssetCount: 0,
    assets: spawn('assets', {
      id: 'assets',
      systemId: 'assets',
      input: {
        ...(input.mode.type === 'editAsset' && input.mode.assetId
          ? {assetId: input.mode.assetId}
          : {}),
        assetTypes: input.assetTypes,
        client: input.client,
        documentAssetIds: input.document ? getDocumentAssetIds(input.document) : [],
        ...(input.document?._id ? {documentId: input.document._id} : {}),
        excludeTagSlugs: input.excludeTagSlugs,
        showMediaLibraryAssets: input.showMediaLibraryAssets,
      },
    }),
    debug: spawn('debug', {id: 'debug', systemId: 'debug'}),
    dialogs: spawn('dialogs', {id: 'dialogs', systemId: 'dialogs'}),
    folders: spawn('folders', {
      id: 'folders',
      systemId: 'folders',
      input: {
        assetTypes: input.assetTypes,
        client: input.client,
        excludeTagSlugs: input.excludeTagSlugs,
        showMediaLibraryAssets: input.showMediaLibraryAssets,
      },
    }),
    tags: spawn('tags', {id: 'tags', systemId: 'tags', input: {client: input.client}}),
    uploads: spawn('uploads', {id: 'uploads', systemId: 'uploads', input: {client: input.client}}),
  }),
  on: {
    // Commands
    'uploads.add': {
      actions: sendTo(
        ({context}) => context.uploads,
        ({context, event}) => ({
          type: 'uploads.add',
          files: event.files,
          folderId: context.assets.getSnapshot().context.currentFolderId,
          ...(context.config.assetTypes.length === 1
            ? {forceAsAssetType: context.config.assetTypes[0]}
            : {}),
        }),
      ),
    },
    'assets.delete': {actions: forwardTo(({context}) => context.assets)},
    'assets.tag.add': {
      actions: [
        forwardTo(({context}) => context.assets),
        sendTo(
          ({context}) => context.tags,
          ({event}) => ({type: 'tag.updating.set', tagId: event.tag._id, updating: true}),
        ),
      ],
    },
    'assets.tag.remove': {
      actions: [
        forwardTo(({context}) => context.assets),
        sendTo(
          ({context}) => context.tags,
          ({event}) => ({type: 'tag.updating.set', tagId: event.tag._id, updating: true}),
        ),
      ],
    },
    'folder.delete': {actions: forwardTo(({context}) => context.folders)},
    'tag.delete': {actions: forwardTo(({context}) => context.tags)},

    // Realtime changes
    'listener.asset': {
      actions: sendTo(
        ({context}) => context.assets,
        ({event}) => ({...event, type: 'listener.mutation'}),
      ),
    },
    'listener.tag': {
      actions: sendTo(
        ({context}) => context.tags,
        ({event}) => ({...event, type: 'listener.mutation'}),
      ),
    },
    'listener.folder': {
      actions: sendTo(({context}) => context.folders, {type: 'fetch'}),
    },

    // Assets
    'assets.fetchFailed': {
      actions: {type: 'notify', params: ({event}) => errorNotification(event.error)},
    },
    'asset.updated': {
      actions: [
        {type: 'close dialog', params: ({event}) => ({id: event.closeDialogId})},
        'refresh folders',
        enqueueActions(({context, enqueue}) => {
          if (context.updatedAssetCount === 0) {
            enqueue.raise(
              {type: 'updatedAssets.notify'},
              {delay: 'update notification batch window'},
            )
          }
          enqueue.assign({updatedAssetCount: context.updatedAssetCount + 1})
        }),
      ],
    },
    'updatedAssets.notify': {
      actions: [
        {
          type: 'notify',
          params: ({context}) => ({
            status: 'info',
            title: `${context.updatedAssetCount} ${pluralize('asset', context.updatedAssetCount)} updated`,
          }),
        },
        assign({updatedAssetCount: 0}),
      ],
    },
    'asset.updateFailed': {
      actions: {type: 'notify', params: ({event}) => errorNotification(event.error)},
    },
    'assets.deleted': {
      actions: [
        {
          type: 'notify',
          params: ({event}) => ({
            status: 'info',
            title: `${event.assetIds.length} ${pluralize('asset', event.assetIds.length)} deleted`,
          }),
        },
        'refresh folders',
      ],
    },
    'assets.deleteFailed': {
      actions: {
        type: 'notify',
        params: ({event}) => ({
          status: 'error',
          title: `Unable to delete ${event.assetIds.length} ${pluralize(
            'asset',
            event.assetIds.length,
          )}. Please review any asset errors and try again.`,
        }),
      },
    },
    'assets.tagged': {
      actions: [
        {
          type: 'notify',
          params: ({event}) => {
            const count = `${event.assets.length} ${pluralize('asset', event.assets.length)}`
            return {
              status: 'info',
              title:
                event.operation === 'add' ? `Tag added to ${count}` : `Tag removed from ${count}`,
            }
          },
        },
        sendTo(
          ({context}) => context.tags,
          ({event}) => ({type: 'tag.updating.set', tagId: event.tag._id, updating: false}),
        ),
      ],
    },
    'assets.taggingFailed': {
      actions: sendTo(
        ({context}) => context.tags,
        ({event}) => ({type: 'tag.updating.set', tagId: event.tag._id, updating: false}),
      ),
    },
    'assets.moved': {
      actions: [
        {type: 'close dialog', params: ({event}) => ({id: event.closeDialogId})},
        'refresh folders',
      ],
    },
    'assets.synced': {actions: 'refresh folders'},
    'uploads.verified': {
      actions: sendTo(
        ({context}) => context.uploads,
        ({event}) => ({type: 'uploads.remove', hashes: event.hashes}),
      ),
    },

    // Tags
    'tags.fetchFailed': {
      actions: {type: 'notify', params: ({event}) => errorNotification(event.error)},
    },
    'tag.created': {
      actions: [
        {type: 'notify', params: {status: 'info', title: 'Tag created'}},
        {type: 'close dialog', params: ({event}) => ({id: event.closeDialogId})},
      ],
    },
    'tag.createFailed': {
      actions: {type: 'notify', params: ({event}) => errorNotification(event.error)},
    },
    'tag.updated': {
      actions: [
        {type: 'notify', params: {status: 'info', title: 'Tag updated'}},
        {type: 'close dialog', params: ({event}) => ({id: event.closeDialogId})},
        sendTo(
          ({context}) => context.assets,
          ({event}) => ({type: 'tag.renamed', tag: event.tag}),
        ),
      ],
    },
    'tag.updateFailed': {
      actions: {type: 'notify', params: ({event}) => errorNotification(event.error)},
    },
    'tag.deleted': {
      actions: {type: 'notify', params: {status: 'info', title: 'Tag deleted'}},
    },
    'tag.deleteFailed': {
      actions: {type: 'notify', params: ({event}) => errorNotification(event.error)},
    },

    // Folders
    'folders.fetched': {
      actions: sendTo(
        ({context}) => context.assets,
        ({event}) => ({type: 'folders.synced', folderIds: event.folderIds}),
      ),
    },
    'folder.created': {
      actions: [
        {type: 'notify', params: {status: 'info', title: 'Folder created'}},
        {type: 'close dialog', params: {id: 'folderCreate'}},
        sendTo(
          ({context}) => context.assets,
          ({event}) => ({type: 'folder.open', folderId: event.folderId}),
        ),
      ],
    },
    'folder.createFailed': {
      actions: {type: 'notify', params: ({event}) => errorNotification(event.error)},
    },
    'folder.renamed': {
      actions: [
        {type: 'notify', params: {status: 'info', title: 'Folder renamed'}},
        {type: 'close dialog', params: {id: 'folderRename'}},
      ],
    },
    'folder.renameFailed': {
      actions: {type: 'notify', params: ({event}) => errorNotification(event.error)},
    },
    'folder.deleted': {
      actions: [
        {type: 'notify', params: {status: 'info', title: 'Folder deleted'}},
        sendTo(
          ({context}) => context.assets,
          ({event}) => ({type: 'folder.deleted', folderId: event.folderId}),
        ),
      ],
    },
    'folder.deleteFailed': {
      actions: {type: 'notify', params: ({event}) => errorNotification(event.error)},
    },

    // Uploads
    'upload.completed': {
      actions: [
        sendTo(
          ({context}) => context.assets,
          ({event}) => ({type: 'upload.completed', asset: event.asset}),
        ),
        'refresh folders',
      ],
    },
    'upload.failed': {
      actions: {type: 'notify', params: ({event}) => errorNotification(event.error)},
    },

    // Dialogs
    'dialog.opened': [
      {
        guard: {type: 'dialog is', params: {type: 'dialogAllAssets'}},
        actions: sendTo(
          ({context}) => context.assets,
          ({event}) => ({type: 'replace.start', assetId: replaceTargetOf(event.dialog)}),
        ),
      },
      {
        guard: {type: 'dialog is', params: {type: 'tagCreate'}},
        actions: sendTo(({context}) => context.tags, {type: 'creatingError.clear'}),
      },
      {
        guard: {type: 'dialog is', params: {type: 'tagEdit'}},
        actions: sendTo(
          ({context}) => context.tags,
          ({event}) => ({type: 'tag.error.clear', tagId: event.dialog.id}),
        ),
      },
      {
        guard: {type: 'dialog is', params: {type: 'folderCreate'}},
        actions: sendTo(({context}) => context.folders, {type: 'creatingError.clear'}),
      },
      {
        guard: {type: 'dialog is', params: {type: 'folderRename'}},
        actions: sendTo(({context}) => context.folders, {type: 'renameError.clear'}),
      },
    ],
    'dialog.closed': {
      guard: {type: 'dialog is', params: {type: 'dialogAllAssets'}},
      actions: sendTo(({context}) => context.assets, {type: 'replace.end'}),
    },
  },
  initial: 'starting',
  states: {
    starting: {
      always: [
        {guard: 'has nothing to edit', target: 'closed'},
        {guard: 'is editing an asset', target: 'editingAsset'},
        {target: 'browsing'},
      ],
    },
    browsing: {
      entry: [
        sendTo(({context}) => context.tags, {type: 'fetch'}),
        sendTo(({context}) => context.folders, {type: 'fetch'}),
      ],
      invoke: [
        {
          src: 'listen to assets',
          input: ({context}) => ({
            client: context.client,
            showMediaLibraryAssets: context.showMediaLibraryAssets,
          }),
        },
        {src: 'listen to tags', input: ({context}) => ({client: context.client})},
        {src: 'listen to folders', input: ({context}) => ({client: context.client})},
      ],
      initial: 'starting',
      states: {
        starting: {
          always: [
            {guard: 'has media tags', target: 'awaitingTags'},
            {target: 'ready', actions: sendTo(({context}) => context.assets, {type: 'load'})},
          ],
        },
        // Fields can pre-filter the browser by tag names, which resolve once tags are loaded
        awaitingTags: {
          on: {
            'tags.fetched': {
              target: 'ready',
              actions: enqueueActions(({context, enqueue, event}) => {
                const facets =
                  context.mode.type === 'browser'
                    ? mediaTagFacets(context.mode.mediaTagNames, event.tags)
                    : []
                enqueue.sendTo(context.assets, {type: 'search.facets.set', facets})
                enqueue.sendTo(context.assets, {type: 'load'})
              }),
            },
            'tags.fetchFailed': {
              target: 'ready',
              actions: [
                {type: 'notify', params: ({event}) => errorNotification(event.error)},
                sendTo(({context}) => context.assets, {type: 'load'}),
              ],
            },
          },
        },
        ready: {},
      },
    },
    editingAsset: {
      entry: [
        sendTo(({context}) => context.assets, {type: 'load'}),
        // Tags and folders resolve the asset's tag references and folder path in the edit dialog
        sendTo(({context}) => context.tags, {type: 'fetch'}),
        sendTo(({context}) => context.folders, {type: 'fetch'}),
        sendTo(
          ({context}) => context.dialogs,
          ({context}) => ({
            type: 'dialog.open',
            dialog: assetEditDialog(context.mode.type === 'editAsset' ? context.mode.assetId! : ''),
          }),
        ),
      ],
      on: {
        'dialogs.emptied': 'closed',
      },
    },
    closed: {
      entry: 'close',
    },
  },
})

export type MediaActorRef = ActorRefFrom<typeof mediaMachine>
export type MediaSnapshot = SnapshotFrom<typeof mediaMachine>
