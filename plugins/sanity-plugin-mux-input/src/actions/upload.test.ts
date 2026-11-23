import {createClient} from '@sanity/client'
import {of, throwError} from 'rxjs'
import type {SanityClient} from 'sanity'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {discardUpload, pollUpload, uploadedAssetTransaction} from './upload'

const client = createClient({
  projectId: 'abc123',
  dataset: 'test',
  apiVersion: '2024-03-05',
  useCdn: false,
})

test('a finished upload patches its fields instead of replacing the document', () => {
  const fields = {
    status: 'preparing',
    data: {id: 'asset-1', status: 'preparing'},
    assetId: 'asset-1',
    playbackId: 'playback-1',
    uploadId: 'upload-1',
  }

  const mutations = uploadedAssetTransaction(client, 'doc-1', fields).serialize()

  expect(mutations).toEqual([
    {createIfNotExists: {_id: 'doc-1', _type: 'mux.videoAsset'}},
    {patch: {id: 'doc-1', set: fields}},
  ])
  expect(JSON.stringify(mutations)).not.toContain('createOrReplace')
})

test('a finished upload names the asset after the file, unless it already has a name', () => {
  const fields = {status: 'preparing', assetId: 'asset-1'}

  const mutations = uploadedAssetTransaction(client, 'doc-1', fields, 'launch-film.mp4').serialize()

  expect(mutations).toEqual([
    {createIfNotExists: {_id: 'doc-1', _type: 'mux.videoAsset'}},
    {patch: {id: 'doc-1', set: fields, setIfMissing: {filename: 'launch-film.mp4'}}},
  ])
})

function fakeClient(request: () => Promise<unknown>, observableRequest = () => of({})) {
  return {
    config: () => ({dataset: 'test'}),
    request,
    observable: {request: observableRequest},
    delete: vi.fn(() => Promise.resolve({})),
  } as unknown as SanityClient & {delete: ReturnType<typeof vi.fn>}
}

describe('pollUpload', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('stops polling at the first failed read', async () => {
    vi.useFakeTimers()
    const request = vi.fn(() => Promise.reject(new Error('Not found')))
    const polling = pollUpload(fakeClient(request), 'doc-1')
    const settled = expect(polling).rejects.toThrow('Not found')

    await vi.advanceTimersByTimeAsync(2_000)
    await settled
    await vi.advanceTimersByTimeAsync(20_000)

    expect(request).toHaveBeenCalledTimes(1)
  })
})

describe('discardUpload', () => {
  test('lets the proxy cancel the upload in Mux and delete its document', async () => {
    const observableRequest = vi.fn(() => of({}))
    const client = fakeClient(() => Promise.resolve({}), observableRequest)

    await discardUpload(client, 'doc-1')

    expect(observableRequest).toHaveBeenCalledWith(
      expect.objectContaining({method: 'DELETE', url: '/addons/mux/uploads/test/doc-1'}),
    )
    expect(client.delete).not.toHaveBeenCalled()
  })

  test('deletes the document itself when the proxy fails', async () => {
    const client = fakeClient(
      () => Promise.resolve({}),
      () => throwError(() => new Error('Bad gateway')),
    )

    await discardUpload(client, 'doc-1')

    expect(client.delete).toHaveBeenCalledWith('doc-1')
  })
})
