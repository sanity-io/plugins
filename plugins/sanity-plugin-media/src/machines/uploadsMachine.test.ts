// @vitest-environment node
import {of, Subject} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {createActor, fromPromise} from 'xstate'

import {imageAsset} from '../__tests__/fixtures/documents'
import {createMockSanityClient, mockPatchChain} from '../__tests__/fixtures/mockSanityClient'
import {createTestParent} from '../__tests__/fixtures/testParent'
import type {AssetType} from '../types'
import {type UploadsActorRef, uploadsMachine, type UploadsReport} from './uploadsMachine'

vi.mock('../utils/generatePreviewBlobUrl', () => ({
  generatePreviewBlobUrl: vi.fn((file: File) => Promise.resolve(`blob:${file.name}`)),
}))

const actors: UploadsActorRef[] = []

afterEach(() => {
  // Cancelling in-flight uploads frees their slots in the shared upload throttler
  for (const actor of actors.splice(0)) {
    for (const hash of actor.getSnapshot().context.allIds) {
      actor.send({type: 'upload.cancel', hash})
    }
  }
  vi.restoreAllMocks()
})

function startUploadsActor({hashFile = (file: File) => Promise.resolve(`${file.name}-hash`)} = {}) {
  const uploadEvents = new Map<string, Subject<unknown>>()
  const client = createMockSanityClient({
    observable: {
      assets: {
        upload: vi.fn((_assetType: AssetType, file: File) => {
          const events = new Subject<unknown>()
          uploadEvents.set(file.name, events)
          return events
        }),
      },
      fetch: vi.fn(() => of(null)),
    },
  })
  const testParent = createTestParent<UploadsReport>()
  const actor = createActor(
    uploadsMachine.provide({
      actors: {'hash file': fromPromise(({input}) => hashFile(input.file))},
    }),
    {input: {client}, parent: testParent.parent},
  ).start()
  actors.push(actor)

  const uploadOf = (fileName: string) => {
    const events = uploadEvents.get(fileName)
    if (!events) {
      throw new Error(`${fileName} is not being uploaded`)
    }
    return events
  }
  return {actor, client, uploadOf, ...testParent}
}

const image = (name: string) => new File(['image'], name, {type: 'image/png'})
const pdf = (name: string) => new File(['pdf'], name, {type: 'application/pdf'})

const waitForHashing = (actor: UploadsActorRef) =>
  vi.waitFor(() => {
    expect(actor.getSnapshot().context.pendingFiles).toEqual([])
    expect(actor.getSnapshot().matches('idle')).toBe(true)
  })

describe(uploadsMachine.id, () => {
  it('hashes files one at a time, then uploads each of them', async () => {
    const {actor, client} = startUploadsActor()

    actor.send({type: 'uploads.add', files: [image('photo.png'), pdf('doc.pdf')], folderId: 'f1'})
    expect(actor.getSnapshot().matches('hashing')).toBe(true)
    expect(actor.getSnapshot().context.pendingFiles).toHaveLength(2)
    await waitForHashing(actor)

    expect(actor.getSnapshot().context.allIds).toEqual(['photo.png-hash', 'doc.pdf-hash'])
    expect(actor.getSnapshot().context.byIds['photo.png-hash']).toMatchObject({
      _type: 'upload',
      assetType: 'image',
      folderId: 'f1',
      hash: 'photo.png-hash',
      name: 'photo.png',
      size: 5,
      status: 'queued',
    })
    expect(actor.getSnapshot().context.byIds['doc.pdf-hash']?.assetType).toBe('file')
    expect(client.observable.assets.upload).toHaveBeenCalledWith('image', expect.any(File), {
      extract: ['blurhash', 'exif', 'image', 'location', 'lqip', 'palette'],
      preserveFilename: true,
    })
    expect(client.observable.assets.upload).toHaveBeenCalledWith(
      'file',
      expect.any(File),
      expect.anything(),
    )
  })

  it('uploads as the only asset type the browser accepts', async () => {
    const {actor} = startUploadsActor()

    actor.send({
      type: 'uploads.add',
      files: [image('photo.png')],
      folderId: null,
      forceAsAssetType: 'file',
    })
    await waitForHashing(actor)

    expect(actor.getSnapshot().context.byIds['photo.png-hash']?.assetType).toBe('file')
  })

  it('ignores files that are already being uploaded', async () => {
    const {actor, client} = startUploadsActor()

    actor.send({type: 'uploads.add', files: [image('photo.png')], folderId: null})
    actor.send({type: 'uploads.add', files: [image('photo.png')], folderId: 'f1'})
    await waitForHashing(actor)

    expect(actor.getSnapshot().context.allIds).toEqual(['photo.png-hash'])
    expect(actor.getSnapshot().context.byIds['photo.png-hash']?.folderId).toBeNull()
    expect(client.observable.assets.upload).toHaveBeenCalledTimes(1)
  })

  it('tracks progress and reports uploads once their asset is created', async () => {
    const {actor, events, uploadOf} = startUploadsActor()
    actor.send({type: 'uploads.add', files: [image('photo.png')], folderId: null})
    await waitForHashing(actor)
    await vi.waitFor(() => expect(() => uploadOf('photo.png')).not.toThrow())

    uploadOf('photo.png').next({percent: 42, stage: 'upload', type: 'progress'})
    expect(actor.getSnapshot().context.byIds['photo.png-hash']).toMatchObject({
      percent: 42,
      status: 'uploading',
    })

    const asset = imageAsset('photo')
    uploadOf('photo.png').next({body: {document: asset}, type: 'response'})
    expect(actor.getSnapshot().context.byIds['photo.png-hash']?.status).toBe('complete')
    expect(events).toEqual([{type: 'upload.completed', asset}])
  })

  it('assigns uploads to their folder before reporting them', async () => {
    const {actor, client, events, uploadOf} = startUploadsActor()
    const asset = imageAsset('photo')
    const inFolder = {...asset, opt: {media: {folder: {_ref: 'f1', _type: 'reference'}}}}
    const patch = mockPatchChain(inFolder)
    client.patch.mockReturnValue(patch)
    actor.send({type: 'uploads.add', files: [image('photo.png')], folderId: 'f1'})
    await waitForHashing(actor)
    await vi.waitFor(() => expect(() => uploadOf('photo.png')).not.toThrow())

    uploadOf('photo.png').next({body: {document: asset}, type: 'response'})
    await vi.waitFor(() => expect(events).toHaveLength(1))

    expect(client.patch).toHaveBeenCalledWith('photo')
    expect(patch.set).toHaveBeenCalledWith({
      'opt.media.folder': {_ref: 'f1', _type: 'reference', _weak: true},
    })
    expect(events).toEqual([{type: 'upload.completed', asset: inFolder}])
  })

  it('reports failed uploads and stops showing them', async () => {
    const {actor, events, uploadOf} = startUploadsActor()
    actor.send({type: 'uploads.add', files: [image('photo.png')], folderId: null})
    await waitForHashing(actor)
    await vi.waitFor(() => expect(() => uploadOf('photo.png')).not.toThrow())

    uploadOf('photo.png').error({message: 'Payload too large', statusCode: 413})

    expect(actor.getSnapshot().context.allIds).toEqual([])
    expect(events).toEqual([
      {type: 'upload.failed', error: {message: 'Payload too large', statusCode: 413}},
    ])
  })

  it('does not upload files that already exist in the dataset', async () => {
    const {actor, client, events} = startUploadsActor()
    client.observable.fetch.mockReturnValue(of(imageAsset('existing')))

    actor.send({type: 'uploads.add', files: [image('photo.png')], folderId: null})
    await vi.waitFor(() => expect(events).toHaveLength(1))

    expect(client.observable.assets.upload).not.toHaveBeenCalled()
    expect(events).toEqual([
      {type: 'upload.failed', error: {message: 'Asset already exists', statusCode: 409}},
    ])
  })

  it('aborts cancelled uploads', async () => {
    const {actor, uploadOf} = startUploadsActor()
    actor.send({type: 'uploads.add', files: [image('photo.png')], folderId: null})
    await waitForHashing(actor)
    await vi.waitFor(() => expect(() => uploadOf('photo.png')).not.toThrow())
    expect(uploadOf('photo.png').observed).toBe(true)

    actor.send({type: 'upload.cancel', hash: 'photo.png-hash'})

    expect(actor.getSnapshot().context.allIds).toEqual([])
    expect(actor.getSnapshot().children['photo.png-hash']).toBeUndefined()
    expect(uploadOf('photo.png').observed).toBe(false)
  })

  it('shows a preview of images, revoked once the upload is removed', async () => {
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const {actor} = startUploadsActor()
    actor.send({type: 'uploads.add', files: [image('photo.png'), pdf('doc.pdf')], folderId: null})
    await waitForHashing(actor)

    await vi.waitFor(() =>
      expect(actor.getSnapshot().context.byIds['photo.png-hash']?.objectUrl).toBe('blob:photo.png'),
    )
    expect(actor.getSnapshot().context.byIds['doc.pdf-hash']?.objectUrl).toBeUndefined()

    actor.send({type: 'uploads.remove', hashes: ['photo.png-hash', 'doc.pdf-hash']})

    expect(actor.getSnapshot().context.allIds).toEqual([])
    expect(revokeObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:photo.png')
  })

  it('reports files that cannot be hashed and moves on to the next one', async () => {
    const {actor, events} = startUploadsActor({
      hashFile: (file) =>
        file.name === 'broken.png'
          ? Promise.reject(new Error('Unable to generate hash'))
          : Promise.resolve(`${file.name}-hash`),
    })

    actor.send({
      type: 'uploads.add',
      files: [image('broken.png'), image('photo.png')],
      folderId: null,
    })
    await waitForHashing(actor)

    expect(events).toEqual([
      {type: 'upload.failed', error: {message: 'Unable to generate hash', statusCode: 500}},
    ])
    expect(actor.getSnapshot().context.allIds).toEqual(['photo.png-hash'])
  })
})
