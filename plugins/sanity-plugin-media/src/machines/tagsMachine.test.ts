// @vitest-environment node
import {describe, expect, it, vi} from 'vitest'
import {createActor, SimulatedClock} from 'xstate'

import {tag} from '../__tests__/fixtures/documents'
import {
  createMockSanityClient,
  deferred,
  mockPatchChain,
  mockTransaction,
} from '../__tests__/fixtures/mockSanityClient'
import {createTestParent} from '../__tests__/fixtures/testParent'
import type {Tag} from '../types'
import {
  selectIsCreatingTag,
  selectTags,
  type TagsActorRef,
  tagsMachine,
  type TagsReport,
} from './tagsMachine'

const alpha = tag('t1', 'alpha')
const beta = tag('t2', 'beta')

function startTagsActor(client = createMockSanityClient()) {
  const clock = new SimulatedClock()
  const testParent = createTestParent<TagsReport>({clock})
  const actor = createActor(tagsMachine, {input: {client}, parent: testParent.parent}).start()
  return {actor, client, clock, ...testParent}
}

const tagNames = (actor: TagsActorRef) =>
  selectTags(actor.getSnapshot()).map((item) => item.tag.name.current)

const waitForMutations = (actor: TagsActorRef) =>
  vi.waitFor(() => expect(actor.getSnapshot().context.mutations).toEqual([]))

/** Starts an actor with `tags` fetched, and a fresh client mock for what comes next. */
async function startWithTags(tags: Tag[]) {
  const harness = startTagsActor(
    createMockSanityClient({fetch: vi.fn().mockResolvedValueOnce(tags).mockResolvedValue(0)}),
  )
  harness.actor.send({type: 'fetch'})
  await vi.waitFor(() => expect(harness.actor.getSnapshot().context.fetchCount).toBe(tags.length))
  harness.events.length = 0
  return harness
}

describe(tagsMachine.id, () => {
  describe('fetching', () => {
    it('loads the tags, sorted by name, and reports them', async () => {
      const client = createMockSanityClient({fetch: vi.fn().mockResolvedValue([beta, alpha])})
      const {actor, events} = startTagsActor(client)

      actor.send({type: 'fetch'})
      expect(actor.getSnapshot().matches({fetch: 'fetching'})).toBe(true)
      await vi.waitFor(() => expect(actor.getSnapshot().matches({fetch: 'idle'})).toBe(true))

      expect(client.fetch.mock.lastCall?.[0]).toContain('_type == "media.tag"')
      expect(tagNames(actor)).toEqual(['alpha', 'beta'])
      expect(actor.getSnapshot().context.fetchCount).toBe(2)
      expect(events).toEqual([{type: 'tags.fetched', tags: [beta, alpha]}])
    })

    it('replaces the tags when fetching again, keeping the busy state of the remaining ones', async () => {
      const {actor, client} = await startWithTags([alpha, beta])
      actor.send({type: 'tag.updating.set', tagId: 't1', updating: true})
      client.fetch.mockResolvedValue([tag('t1', 'alpha'), tag('t3', 'gamma')])

      actor.send({type: 'fetch'})
      await vi.waitFor(() => expect(actor.getSnapshot().matches({fetch: 'idle'})).toBe(true))

      expect(tagNames(actor)).toEqual(['alpha', 'gamma'])
      expect(actor.getSnapshot().context.byIds['t2']).toBeUndefined()
      expect(actor.getSnapshot().context.byIds['t1']?.updating).toBe(true)
    })

    it('reports failed fetches', async () => {
      const client = createMockSanityClient({
        fetch: vi.fn().mockRejectedValue({message: 'boom', statusCode: 500}),
      })
      const {actor, events} = startTagsActor(client)

      actor.send({type: 'fetch'})
      await vi.waitFor(() => expect(events).toHaveLength(1))

      expect(events).toEqual([
        {type: 'tags.fetchFailed', error: {message: 'boom', statusCode: 500}},
      ])
      expect(actor.getSnapshot().context.fetchCount).toBe(-1)
    })
  })

  describe('creating', () => {
    it('creates a tag once its name is available', async () => {
      const {actor, client, events} = await startWithTags([beta])
      const created = deferred<Tag>()
      client.create.mockReturnValue(created.promise)

      actor.send({type: 'tag.create', closeDialogId: 'tagCreate', name: 'alpha'})
      expect(selectIsCreatingTag(actor.getSnapshot())).toBe(true)
      await vi.waitFor(() => expect(client.create).toHaveBeenCalled())
      created.resolve(alpha)
      await waitForMutations(actor)

      expect(client.fetch).toHaveBeenLastCalledWith(
        'count(*[_type == "media.tag" && name.current == $name])',
        {name: 'alpha'},
      )
      expect(client.create).toHaveBeenCalledWith({
        _type: 'media.tag',
        name: {_type: 'slug', current: 'alpha'},
      })
      expect(selectIsCreatingTag(actor.getSnapshot())).toBe(false)
      expect(tagNames(actor)).toEqual(['alpha', 'beta'])
      expect(events).toEqual([{type: 'tag.created', closeDialogId: 'tagCreate', tag: alpha}])
    })

    it('rejects names that are taken', async () => {
      const {actor, client, events} = await startWithTags([alpha])
      client.fetch.mockResolvedValue(1)

      actor.send({type: 'tag.create', name: 'alpha'})
      await waitForMutations(actor)

      expect(client.create).not.toHaveBeenCalled()
      expect(actor.getSnapshot().context.creatingError).toEqual({
        message: 'Tag already exists',
        statusCode: 409,
      })
      expect(events).toEqual([
        {type: 'tag.createFailed', error: {message: 'Tag already exists', statusCode: 409}},
      ])

      actor.send({type: 'creatingError.clear'})
      expect(actor.getSnapshot().context.creatingError).toBeUndefined()
    })
  })

  describe('updating', () => {
    it('renames the tag and reports it with the dialog to close', async () => {
      const {actor, client, events} = await startWithTags([alpha, beta])
      const renamed = tag('t1', 'gamma')
      const patch = mockPatchChain(renamed)
      client.patch.mockReturnValue(patch)

      actor.send({type: 'tag.update', closeDialogId: 't1', name: 'gamma', tag: alpha})
      expect(actor.getSnapshot().context.byIds['t1']?.updating).toBe(true)
      await waitForMutations(actor)

      expect(client.patch).toHaveBeenCalledWith('t1')
      expect(patch.set).toHaveBeenCalledWith({name: {_type: 'slug', current: 'gamma'}})
      expect(tagNames(actor)).toEqual(['beta', 'gamma'])
      expect(actor.getSnapshot().context.byIds['t1']).toEqual({
        _type: 'tag',
        tag: renamed,
        updating: false,
      })
      expect(events).toEqual([{type: 'tag.updated', closeDialogId: 't1', tag: renamed}])
    })

    it('attaches failures to the tag until its dialog reopens', async () => {
      const {actor, client, events} = await startWithTags([alpha, beta])
      client.fetch.mockResolvedValue(1)

      actor.send({type: 'tag.update', name: 'beta', tag: alpha})
      await waitForMutations(actor)

      const error = {message: 'Tag already exists', statusCode: 409}
      expect(client.patch).not.toHaveBeenCalled()
      expect(actor.getSnapshot().context.byIds['t1']).toMatchObject({error, updating: false})
      expect(events).toEqual([{type: 'tag.updateFailed', error}])

      actor.send({type: 'tag.error.clear', tagId: 't1'})
      expect(actor.getSnapshot().context.byIds['t1']?.error).toBeUndefined()
    })
  })

  describe('deleting', () => {
    it('removes the tag from referencing assets and deletes it in one transaction', async () => {
      const {actor, client, events} = await startWithTags([alpha, beta])
      client.fetch.mockResolvedValue([
        {_id: 'a1', _rev: 'r1'},
        {_id: 'a2', _rev: 'r2'},
      ])
      const transaction = mockTransaction()
      client.transaction.mockReturnValue(transaction)

      actor.send({type: 'tag.delete', tag: alpha})
      expect(actor.getSnapshot().context.byIds['t1']?.updating).toBe(true)
      await waitForMutations(actor)

      expect(client.fetch).toHaveBeenLastCalledWith(expect.stringContaining('references('), {
        tagName: 'alpha',
      })
      expect(transaction.patch).toHaveBeenCalledWith('a1', {
        ifRevisionID: 'r1',
        unset: ['opt.media.tags[_ref == "t1"]'],
      })
      expect(transaction.delete).toHaveBeenCalledWith('t1')
      expect(transaction.commit).toHaveBeenCalledTimes(1)
      expect(tagNames(actor)).toEqual(['beta'])
      expect(events).toEqual([{type: 'tag.deleted', tagId: 't1'}])
    })

    it('attaches failures to the tag', async () => {
      const {actor, client, events} = await startWithTags([alpha])
      client.fetch.mockRejectedValue({message: 'Forbidden', statusCode: 403})

      actor.send({type: 'tag.delete', tag: alpha})
      await waitForMutations(actor)

      const error = {message: 'Forbidden', statusCode: 403}
      expect(actor.getSnapshot().context.byIds['t1']).toMatchObject({error, updating: false})
      expect(events).toEqual([{type: 'tag.deleteFailed', error}])
    })
  })

  it('runs tag mutations one at a time', async () => {
    const {actor, client} = await startWithTags([alpha, beta])
    const created = deferred<Tag>()
    client.create.mockReturnValue(created.promise)

    actor.send({type: 'tag.create', name: 'gamma'})
    actor.send({type: 'tag.delete', tag: beta})
    await vi.waitFor(() => expect(client.create).toHaveBeenCalled())

    expect(client.transaction).not.toHaveBeenCalled()
    created.resolve(tag('t3', 'gamma'))
    await waitForMutations(actor)
    expect(client.transaction).toHaveBeenCalled()
  })

  it('keeps mutations going while tags are refetched', async () => {
    const {actor, client} = await startWithTags([beta])
    const created = deferred<Tag>()
    client.create.mockReturnValue(created.promise)
    actor.send({type: 'tag.create', name: 'alpha'})
    await vi.waitFor(() => expect(client.create).toHaveBeenCalled())

    client.fetch.mockResolvedValue([beta])
    actor.send({type: 'fetch'})
    await vi.waitFor(() => expect(actor.getSnapshot().matches({fetch: 'idle'})).toBe(true))

    expect(client.create).toHaveBeenCalledTimes(1)
    created.resolve(alpha)
    await waitForMutations(actor)
    expect(tagNames(actor)).toEqual(['alpha', 'beta'])
  })

  it('keeps a tag created before an older fetch returned without it', async () => {
    const {actor, client} = await startWithTags([beta])
    const fetched = deferred<Tag[]>()
    client.fetch.mockImplementation((query: string) =>
      query.startsWith('count(') ? Promise.resolve(0) : fetched.promise,
    )
    client.create.mockResolvedValue(alpha)

    actor.send({type: 'fetch'})
    actor.send({type: 'tag.create', name: 'alpha'})
    await waitForMutations(actor)

    fetched.resolve([beta])
    await vi.waitFor(() => expect(actor.getSnapshot().matches({fetch: 'idle'})).toBe(true))

    expect(tagNames(actor)).toEqual(['alpha', 'beta'])
  })

  it('marks tags as busy while assets are being tagged', async () => {
    const {actor} = await startWithTags([alpha])

    actor.send({type: 'tag.updating.set', tagId: 't1', updating: true})
    expect(actor.getSnapshot().context.byIds['t1']?.updating).toBe(true)

    actor.send({type: 'tag.updating.set', tagId: 't1', updating: false})
    expect(actor.getSnapshot().context.byIds['t1']?.updating).toBe(false)
  })

  it('toggles the tags panel', () => {
    const {actor} = startTagsActor()
    expect(actor.getSnapshot().context.panelVisible).toBe(true)

    actor.send({type: 'panel.visible.set', visible: false})
    expect(actor.getSnapshot().context.panelVisible).toBe(false)
  })

  it('applies realtime changes in batches', async () => {
    const {actor, clock} = await startWithTags([alpha, beta])

    actor.send({
      type: 'listener.mutation',
      documentId: 't3',
      result: tag('t3', 'aardvark'),
      transition: 'appear',
    })
    actor.send({
      type: 'listener.mutation',
      documentId: 't2',
      result: tag('t2', 'zebra'),
      transition: 'update',
    })
    actor.send({type: 'listener.mutation', documentId: 't1', transition: 'disappear'})
    actor.send({
      type: 'listener.mutation',
      documentId: 't4',
      result: tag('t4', 'unknown'),
      transition: 'update',
    })
    clock.increment(1999)
    expect(tagNames(actor)).toEqual(['alpha', 'beta'])

    clock.increment(1)
    expect(tagNames(actor)).toEqual(['aardvark', 'zebra'])
  })
})
