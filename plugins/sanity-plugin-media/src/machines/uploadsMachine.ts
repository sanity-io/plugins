import type {SanityClient} from '@sanity/client'
import {from, of} from 'rxjs'
import {map, mergeMap} from 'rxjs/operators'
import {
  type ActorRefFrom,
  assign,
  enqueueActions,
  type EventObject,
  fromCallback,
  fromPromise,
  sendParent,
  setup,
  type SnapshotFrom,
} from 'xstate'

import type {Asset, AssetType, HttpError, SanityUploadProgressEvent, UploadItem} from '../types'
import {generatePreviewBlobUrl} from '../utils/generatePreviewBlobUrl'
import {hashFile, uploadAsset$} from '../utils/uploadSanityAsset'
import {toHttpError} from './utils'

type UploadRequest = {file: File; folderId: string | null; forceAsAssetType?: AssetType}

export type UploadsContext = {
  allIds: string[]
  byIds: Record<string, UploadItem>
  client: SanityClient
  /** Files waiting to be hashed, which identifies (and dedupes) uploads. */
  pendingFiles: UploadRequest[]
}

/** Sent back by the actor uploading a file. */
type UploadProgressEvent =
  | {type: 'upload.preview'; hash: string; url: string}
  | {type: 'upload.progress'; hash: string; percent: number}
  | {type: 'upload.complete'; asset: Asset; hash: string}
  | {type: 'upload.error'; error: HttpError; hash: string}

export type UploadsEvent =
  | {type: 'uploads.add'; files: File[]; folderId: string | null; forceAsAssetType?: AssetType}
  | {type: 'upload.cancel'; hash: string}
  /** Removes uploads once their assets have been verified against the browse filter. */
  | {type: 'uploads.remove'; hashes: string[]}
  | UploadProgressEvent

export type UploadsReport =
  | {type: 'upload.completed'; asset: Asset}
  | {type: 'upload.failed'; error: HttpError}

export type UploadInput = {
  client: SanityClient
  file: File
  upload: UploadItem
}

type UploadAssetEvent =
  | {asset: Asset; type: 'complete'}
  | SanityUploadProgressEvent
  | {type: 'response' | 'reset'}

/**
 * Uploads a file (throttled across uploads), assigns it to its folder, and generates a low
 * resolution preview of images in the meantime. Stopping the actor aborts the upload.
 */
const uploadAsset = fromCallback<EventObject, UploadInput>(({input, sendBack}) => {
  const {client, file, upload} = input
  let stopped = false

  if (upload.assetType === 'image') {
    generatePreviewBlobUrl(file)
      .then((url) => {
        if (stopped) {
          URL.revokeObjectURL(url)
          return
        }
        sendBack({type: 'upload.preview', hash: upload.hash, url} satisfies UploadProgressEvent)
      })
      // A missing preview is not worth failing the upload over
      .catch(() => undefined)
  }

  const subscription = uploadAsset$(client, upload.assetType, file, upload.hash)
    .pipe(
      mergeMap((event: UploadAssetEvent) => {
        if (event.type !== 'complete' || !upload.folderId) {
          return of(event)
        }
        return from(
          client
            .patch(event.asset._id)
            .setIfMissing({opt: {}})
            .setIfMissing({'opt.media': {}})
            .set({'opt.media.folder': {_ref: upload.folderId, _type: 'reference', _weak: true}})
            .commit(),
        ).pipe(map((asset) => ({asset: asset as unknown as Asset, type: 'complete' as const})))
      }),
    )
    .subscribe({
      next: (event) => {
        if (event.type === 'complete') {
          sendBack({type: 'upload.complete', asset: event.asset, hash: upload.hash})
        } else if (event.type === 'progress' && event.stage === 'upload') {
          sendBack({type: 'upload.progress', hash: upload.hash, percent: event.percent})
        }
      },
      error: (error: unknown) => {
        sendBack({type: 'upload.error', error: toHttpError(error), hash: upload.hash})
      },
    })

  return () => {
    stopped = true
    subscription.unsubscribe()
  }
})

const hashUpload = fromPromise<string, {file: File}>(({input}) => hashFile(input.file))

/** Uploads dropped or picked files, showing their progress until their assets are listed. */
export const uploadsMachine = setup({
  types: {} as {
    context: UploadsContext
    events: UploadsEvent
    input: {client: SanityClient}
  },
  actors: {
    'hash file': hashUpload,
    'upload asset': uploadAsset,
  },
  guards: {
    'has pending files': ({context}) => context.pendingFiles.length > 0,
  },
  actions: {
    'report': sendParent((_, report: UploadsReport) => report),
    'remove uploads': enqueueActions(({context, enqueue}, params: {hashes: string[]}) => {
      const removed = new Set(params.hashes)
      for (const hash of removed) {
        enqueue.stopChild(hash)
      }
      enqueue(() => {
        for (const hash of removed) {
          const objectUrl = context.byIds[hash]?.objectUrl
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl)
          }
        }
      })
      enqueue.assign({
        allIds: context.allIds.filter((hash) => !removed.has(hash)),
        byIds: Object.fromEntries(
          Object.entries(context.byIds).filter(([hash]) => !removed.has(hash)),
        ),
      })
    }),
  },
}).createMachine({
  id: 'uploads',
  context: ({input}) => ({
    allIds: [],
    byIds: {},
    client: input.client,
    pendingFiles: [],
  }),
  on: {
    'uploads.add': {
      actions: assign({
        pendingFiles: ({context, event}) => [
          ...context.pendingFiles,
          ...event.files.map((file) => ({
            file,
            folderId: event.folderId,
            ...(event.forceAsAssetType ? {forceAsAssetType: event.forceAsAssetType} : {}),
          })),
        ],
      }),
    },
    'upload.preview': [
      {
        guard: ({context, event}) => event.hash in context.byIds,
        actions: assign({
          byIds: ({context, event}) => ({
            ...context.byIds,
            [event.hash]: {...context.byIds[event.hash]!, objectUrl: event.url},
          }),
        }),
      },
      {actions: ({event}) => URL.revokeObjectURL(event.url)},
    ],
    'upload.progress': {
      guard: ({context, event}) => event.hash in context.byIds,
      actions: assign({
        byIds: ({context, event}) => ({
          ...context.byIds,
          [event.hash]: {
            ...context.byIds[event.hash]!,
            percent: event.percent,
            status: 'uploading',
          },
        }),
      }),
    },
    'upload.complete': {
      guard: ({context, event}) => event.hash in context.byIds,
      actions: [
        assign({
          byIds: ({context, event}) => ({
            ...context.byIds,
            [event.hash]: {...context.byIds[event.hash]!, status: 'complete'},
          }),
        }),
        {type: 'report', params: ({event}) => ({type: 'upload.completed', asset: event.asset})},
      ],
    },
    'upload.error': {
      actions: [
        {type: 'remove uploads', params: ({event}) => ({hashes: [event.hash]})},
        {type: 'report', params: ({event}) => ({type: 'upload.failed', error: event.error})},
      ],
    },
    'upload.cancel': {
      actions: {type: 'remove uploads', params: ({event}) => ({hashes: [event.hash]})},
    },
    'uploads.remove': {
      actions: {type: 'remove uploads', params: ({event}) => ({hashes: event.hashes})},
    },
  },
  initial: 'idle',
  states: {
    idle: {
      always: {guard: 'has pending files', target: 'hashing'},
    },
    hashing: {
      invoke: {
        src: 'hash file',
        input: ({context}) => ({file: context.pendingFiles[0]!.file}),
        onDone: {
          target: 'idle',
          actions: enqueueActions(({context, enqueue, event}) => {
            const {file, folderId, forceAsAssetType} = context.pendingFiles[0]!
            const hash = event.output
            enqueue.assign({pendingFiles: context.pendingFiles.slice(1)})
            // The same file is already being uploaded
            if (hash in context.byIds) {
              return
            }
            const upload: UploadItem = {
              _type: 'upload',
              assetType: forceAsAssetType ?? (file.type.includes('image') ? 'image' : 'file'),
              folderId,
              hash,
              name: file.name,
              size: file.size,
              status: 'queued',
            }
            enqueue.assign({
              allIds: [...context.allIds, hash],
              byIds: {...context.byIds, [hash]: upload},
            })
            enqueue.spawnChild('upload asset', {
              id: hash,
              input: {client: context.client, file, upload},
            })
          }),
        },
        onError: {
          target: 'idle',
          actions: enqueueActions(({context, enqueue, event}) => {
            enqueue.assign({pendingFiles: context.pendingFiles.slice(1)})
            enqueue({
              type: 'report',
              params: {type: 'upload.failed', error: toHttpError(event.error)},
            })
          }),
        },
      },
    },
  },
})

export type UploadsActorRef = ActorRefFrom<typeof uploadsMachine>
export type UploadsSnapshot = SnapshotFrom<typeof uploadsMachine>
