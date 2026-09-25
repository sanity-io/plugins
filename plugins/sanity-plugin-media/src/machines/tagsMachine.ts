import type {SanityClient} from '@sanity/client'
import groq from 'groq'
import {
  type ActorRefFrom,
  assertEvent,
  assign,
  enqueueActions,
  sendParent,
  setup,
  type SnapshotFrom,
} from 'xstate'

import {TAG_DOCUMENT_NAME} from '../constants'
import type {Asset, HttpError, Tag, TagItem} from '../types'
import {assertTagNameAvailable} from '../utils/assertTagNameAvailable'
import {withBadConnection} from './debugMachine'
import {createSelector, fromMutation, fromRequest, toHttpError} from './utils'

type TagMutation =
  | {kind: 'create'; closeDialogId?: string; name: string}
  | {kind: 'update'; closeDialogId?: string; name: string; tag: Tag}
  | {kind: 'delete'; tag: Tag}

export type TagListenerEvent = {
  documentId: string
  result?: Tag
  transition: 'appear' | 'disappear' | 'update'
}

export type TagsContext = {
  allIds: string[]
  byIds: Record<string, TagItem>
  client: SanityClient
  creatingError: HttpError | undefined
  /** Number of tags retrieved by the last fetch, or -1 before it completes. */
  fetchCount: number
  listenerEvents: TagListenerEvent[]
  mutations: TagMutation[]
  panelVisible: boolean
}

export type TagsEvent =
  | {type: 'fetch'}
  | {type: 'tag.create'; closeDialogId?: string; name: string}
  | {type: 'tag.update'; closeDialogId?: string; name: string; tag: Tag}
  | {type: 'tag.delete'; tag: Tag}
  /** Marks a tag as busy while it is being added to or removed from assets. */
  | {type: 'tag.updating.set'; tagId: string; updating: boolean}
  | {type: 'tag.error.clear'; tagId: string}
  | {type: 'creatingError.clear'}
  | {type: 'panel.visible.set'; visible: boolean}
  | ({type: 'listener.mutation'} & TagListenerEvent)

export type TagsReport =
  | {type: 'tags.fetched'; tags: Tag[]}
  | {type: 'tags.fetchFailed'; error: HttpError}
  | {type: 'tag.created'; closeDialogId?: string | undefined; tag: Tag}
  | {type: 'tag.createFailed'; error: HttpError}
  | {type: 'tag.updated'; closeDialogId?: string | undefined; tag: Tag}
  | {type: 'tag.updateFailed'; error: HttpError}
  | {type: 'tag.deleted'; tagId: string}
  | {type: 'tag.deleteFailed'; error: HttpError}

const compareTagNames = (a: TagItem | undefined, b: TagItem | undefined) => {
  const nameA = a?.tag.name.current ?? ''
  const nameB = b?.tag.name.current ?? ''
  if (nameA < nameB) {
    return -1
  }
  return nameA > nameB ? 1 : 0
}

function sortTagIds(allIds: string[], byIds: Record<string, TagItem>) {
  return allIds.toSorted((a, b) => compareTagNames(byIds[a], byIds[b]))
}

function upsertTags(context: Pick<TagsContext, 'allIds' | 'byIds'>, tags: Tag[]) {
  const byIds = {...context.byIds}
  for (const tag of tags) {
    const existing = byIds[tag._id]
    byIds[tag._id] = existing ? {...existing, tag} : {_type: 'tag', tag, updating: false}
  }
  const allIds = [...new Set([...context.allIds, ...tags.map((tag) => tag._id)])]
  return {allIds: sortTagIds(allIds, byIds), byIds}
}

function updateTagItem(
  byIds: Record<string, TagItem>,
  tagId: string,
  update: (item: TagItem) => TagItem,
) {
  const item = byIds[tagId]
  return item ? {...byIds, [tagId]: update(item)} : byIds
}

function removeTagItems(context: Pick<TagsContext, 'allIds' | 'byIds'>, tagIds: string[]) {
  const removed = new Set(tagIds)
  const byIds = {...context.byIds}
  for (const tagId of removed) {
    delete byIds[tagId]
  }
  return {allIds: context.allIds.filter((id) => !removed.has(id)), byIds}
}

function nextMutation<TKind extends TagMutation['kind']>(context: TagsContext, kind: TKind) {
  const mutation = context.mutations[0]
  if (mutation?.kind !== kind) {
    throw new Error(`Expected a queued "${kind}" tag mutation`)
  }
  return mutation as Extract<TagMutation, {kind: TKind}>
}

type ClientInput = {client: SanityClient}

const fetchTags = fromRequest<Tag[], ClientInput>(({input, signal, system}) =>
  withBadConnection(system, signal, () =>
    input.client.fetch<Tag[]>(
      groq`*[
        _type == "${TAG_DOCUMENT_NAME}"
        && !(_id in path("drafts.**"))
      ] {
        _createdAt,
        _updatedAt,
        _id,
        _rev,
        _type,
        name
      } | order(name.current asc)`,
      {},
      {signal},
    ),
  ),
)

const createTag = fromMutation<Tag, ClientInput & {name: string}>(({input, system}) =>
  withBadConnection(system, undefined, async () => {
    await assertTagNameAvailable(input.client, input.name)
    const tag = await input.client.create({
      _type: TAG_DOCUMENT_NAME,
      name: {_type: 'slug', current: input.name},
    })
    return tag as unknown as Tag
  }),
)

const updateTag = fromMutation<Tag, ClientInput & {name: string; tag: Tag}>(({input, system}) =>
  withBadConnection(system, undefined, async () => {
    await assertTagNameAvailable(input.client, input.name)
    const tag = await input.client
      .patch(input.tag._id)
      .set({name: {_type: 'slug', current: input.name}})
      .commit()
    return tag as unknown as Tag
  }),
)

/** Removes the tag from every asset referencing it, then deletes it, in one transaction. */
const deleteTag = fromMutation<void, ClientInput & {tag: Tag}>(({input, system}) =>
  withBadConnection(system, undefined, async () => {
    const {client, tag} = input
    const assets = await client.fetch<Pick<Asset, '_id' | '_rev'>[]>(
      groq`*[
        _type in ["sanity.fileAsset", "sanity.imageAsset"]
        && references(*[_type == "${TAG_DOCUMENT_NAME}" && name.current == $tagName]._id)
      ] {
        _id,
        _rev
      }`,
      {tagName: tag.name.current},
    )
    const transaction = assets.reduce(
      (tx, asset) =>
        tx.patch(asset._id, {
          // Fails the transaction if the asset changed since it was fetched
          ifRevisionID: asset._rev,
          unset: [`opt.media.tags[_ref == "${tag._id}"]`],
        }),
      client.transaction(),
    )
    await transaction.delete(tag._id).commit()
  }),
)

/** Media tags: the tag list, tag mutations and realtime tag updates. */
export const tagsMachine = setup({
  types: {} as {
    context: TagsContext
    events: TagsEvent
    input: ClientInput
  },
  actors: {
    'create tag': createTag,
    'delete tag': deleteTag,
    'fetch tags': fetchTags,
    'update tag': updateTag,
  },
  delays: {
    'listener batch window': 2000,
  },
  guards: {
    'next mutation is': ({context}, params: {kind: TagMutation['kind']}) =>
      context.mutations[0]?.kind === params.kind,
  },
  actions: {
    'report': sendParent((_, report: TagsReport) => report),
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
          ;({allIds, byIds} = removeTagItems({allIds, byIds}, [documentId]))
        } else if (result && (transition === 'appear' || byIds[documentId])) {
          ;({allIds, byIds} = upsertTags({allIds, byIds}, [result]))
        }
      }
      return {allIds, byIds, listenerEvents: []}
    }),
  },
}).createMachine({
  id: 'tags',
  type: 'parallel',
  context: ({input}) => ({
    allIds: [],
    byIds: {},
    client: input.client,
    creatingError: undefined,
    fetchCount: -1,
    listenerEvents: [],
    mutations: [],
    panelVisible: true,
  }),
  on: {
    'tag.create': {
      actions: assign(({context, event}) => ({
        creatingError: undefined,
        mutations: [
          ...context.mutations,
          {
            kind: 'create',
            name: event.name,
            ...(event.closeDialogId ? {closeDialogId: event.closeDialogId} : {}),
          },
        ],
      })),
    },
    'tag.update': {
      actions: assign(({context, event}) => ({
        byIds: updateTagItem(context.byIds, event.tag._id, (item) => ({...item, updating: true})),
        mutations: [
          ...context.mutations,
          {
            kind: 'update',
            name: event.name,
            tag: event.tag,
            ...(event.closeDialogId ? {closeDialogId: event.closeDialogId} : {}),
          },
        ],
      })),
    },
    'tag.delete': {
      actions: assign(({context, event}) => ({
        // Errors from a previous failed attempt no longer apply
        byIds: updateTagItem(
          Object.fromEntries(
            Object.entries(context.byIds).map(([id, {error: _error, ...item}]) => [id, item]),
          ),
          event.tag._id,
          (item) => ({...item, updating: true}),
        ),
        mutations: [...context.mutations, {kind: 'delete', tag: event.tag}],
      })),
    },
    'tag.updating.set': {
      actions: assign({
        byIds: ({context, event}) =>
          updateTagItem(context.byIds, event.tagId, (item) => ({
            ...item,
            updating: event.updating,
          })),
      }),
    },
    'tag.error.clear': {
      actions: assign({
        byIds: ({context, event}) =>
          updateTagItem(context.byIds, event.tagId, ({error: _error, ...item}) => item),
      }),
    },
    'creatingError.clear': {
      actions: assign({creatingError: undefined}),
    },
    'panel.visible.set': {
      actions: assign({panelVisible: ({event}) => event.visible}),
    },
  },
  states: {
    fetch: {
      initial: 'idle',
      on: {
        fetch: {target: '.fetching'},
      },
      states: {
        idle: {},
        fetching: {
          invoke: {
            src: 'fetch tags',
            input: ({context}) => ({client: context.client}),
            onDone: {
              target: 'idle',
              actions: [
                assign(({context, event}) => {
                  // Tags missing from the result are gone, the others keep their busy and error state
                  const fetchedIds = new Set(event.output.map((tag) => tag._id))
                  const byIds = Object.fromEntries(
                    Object.entries(context.byIds).filter(([tagId]) => fetchedIds.has(tagId)),
                  )
                  return {
                    ...upsertTags({allIds: [], byIds}, event.output),
                    fetchCount: event.output.length,
                  }
                }),
                {type: 'report', params: ({event}) => ({type: 'tags.fetched', tags: event.output})},
              ],
            },
            onError: {
              target: 'idle',
              actions: {
                type: 'report',
                params: ({event}) => ({type: 'tags.fetchFailed', error: toHttpError(event.error)}),
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
            {guard: {type: 'next mutation is', params: {kind: 'update'}}, target: 'updating'},
            {guard: {type: 'next mutation is', params: {kind: 'delete'}}, target: 'deleting'},
          ],
        },
        creating: {
          invoke: {
            src: 'create tag',
            input: ({context}) => ({
              client: context.client,
              name: nextMutation(context, 'create').name,
            }),
            onDone: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                const {closeDialogId} = nextMutation(context, 'create')
                enqueue.assign({
                  ...upsertTags(context, [event.output]),
                  mutations: context.mutations.slice(1),
                })
                enqueue({
                  type: 'report',
                  params: {type: 'tag.created', closeDialogId, tag: event.output},
                })
              }),
            },
            onError: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                const error = toHttpError(event.error)
                enqueue.assign({creatingError: error, mutations: context.mutations.slice(1)})
                enqueue({type: 'report', params: {type: 'tag.createFailed', error}})
              }),
            },
          },
        },
        updating: {
          invoke: {
            src: 'update tag',
            input: ({context}) => {
              const {name, tag} = nextMutation(context, 'update')
              return {client: context.client, name, tag}
            },
            onDone: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                const {closeDialogId} = nextMutation(context, 'update')
                const {allIds, byIds} = upsertTags(context, [event.output])
                enqueue.assign({
                  allIds,
                  byIds: updateTagItem(byIds, event.output._id, (item) => ({
                    ...item,
                    updating: false,
                  })),
                  mutations: context.mutations.slice(1),
                })
                enqueue({
                  type: 'report',
                  params: {type: 'tag.updated', closeDialogId, tag: event.output},
                })
              }),
            },
            onError: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                const {tag} = nextMutation(context, 'update')
                const error = toHttpError(event.error)
                enqueue.assign({
                  byIds: updateTagItem(context.byIds, tag._id, (item) => ({
                    ...item,
                    error,
                    updating: false,
                  })),
                  mutations: context.mutations.slice(1),
                })
                enqueue({type: 'report', params: {type: 'tag.updateFailed', error}})
              }),
            },
          },
        },
        deleting: {
          invoke: {
            src: 'delete tag',
            input: ({context}) => ({
              client: context.client,
              tag: nextMutation(context, 'delete').tag,
            }),
            onDone: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue}) => {
                const {tag} = nextMutation(context, 'delete')
                enqueue.assign({
                  ...removeTagItems(context, [tag._id]),
                  mutations: context.mutations.slice(1),
                })
                enqueue({type: 'report', params: {type: 'tag.deleted', tagId: tag._id}})
              }),
            },
            onError: {
              target: 'idle',
              actions: enqueueActions(({context, enqueue, event}) => {
                const {tag} = nextMutation(context, 'delete')
                const error = toHttpError(event.error)
                enqueue.assign({
                  byIds: updateTagItem(context.byIds, tag._id, (item) => ({
                    ...item,
                    error,
                    updating: false,
                  })),
                  mutations: context.mutations.slice(1),
                })
                enqueue({type: 'report', params: {type: 'tag.deleteFailed', error}})
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
            'listener batch window': {target: 'idle', actions: 'apply listener events'},
          },
        },
      },
    },
  },
})

export type TagsActorRef = ActorRefFrom<typeof tagsMachine>
export type TagsSnapshot = SnapshotFrom<typeof tagsMachine>

export const selectTags = createSelector(
  (snapshot: TagsSnapshot) => [snapshot.context.allIds, snapshot.context.byIds],
  (allIds, byIds): TagItem[] =>
    allIds.flatMap((id) => {
      const item = byIds[id]
      return item ? [item] : []
    }),
)

export const selectIsFetchingTags = (snapshot: TagsSnapshot): boolean =>
  snapshot.matches({fetch: 'fetching'})

export const selectIsCreatingTag = (snapshot: TagsSnapshot): boolean =>
  snapshot.context.mutations.some((mutation) => mutation.kind === 'create')
