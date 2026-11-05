import {createClient} from '@sanity/client'
import {defer, type Observable, of, throwError} from 'rxjs'
import {TestScheduler} from 'rxjs/testing'
import type {SanityClient} from 'sanity'
import {describe, expect, test} from 'vitest'

import {cancelUpload, pollUpload, uploadedAssetTransaction} from './upload'

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

const notFound = Object.assign(new Error('Not found'), {statusCode: 404})
const forbidden = Object.assign(new Error('Forbidden'), {statusCode: 403})

/**
 * A client whose requests answer with `responses` in turn (an Error fails the request).
 * Records each request's options and when it was sent.
 */
function fakeClient(scheduler: TestScheduler, responses: unknown[]) {
  const requests: {at: number; options: Record<string, unknown>}[] = []
  const client = {
    config: () => ({dataset: 'test'}),
    withConfig: () => client,
    observable: {
      request: (options: Record<string, unknown>): Observable<unknown> =>
        defer(() => {
          requests.push({at: scheduler.now(), options})
          const response = responses.shift()
          return response instanceof Error ? throwError(() => response) : of(response)
        }),
    },
  }
  return {client: client as unknown as SanityClient, requests}
}

function createScheduler() {
  return new TestScheduler((actual, expected) => expect(actual).toEqual(expected))
}

const pending = {data: {id: 'upload-1', status: 'waiting'}}
const ready = {data: {id: 'upload-1', status: 'asset_created', asset_id: 'asset-1'}}

describe('pollUpload', () => {
  test('waits a moment, then retries 404s and pending uploads with backoff', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client, requests} = fakeClient(scheduler, [notFound, notFound, pending, ready])
      expectObservable(pollUpload(client, 'uuid-1')).toBe('1600ms (a|)', {a: ready})
      scheduler.flush()
      expect(requests.map(({at}) => at)).toEqual([200, 400, 800, 1600])
      for (const {options} of requests) {
        expect(options).toMatchObject({
          url: '/addons/mux/uploads/test/uuid-1',
          method: 'GET',
          maxRetries: 0,
        })
      }
    })
  })

  test('fails straight away on an error that is not retryable', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client, requests} = fakeClient(scheduler, [notFound, forbidden])
      expectObservable(pollUpload(client, 'uuid-1')).toBe('400ms #', undefined, forbidden)
      scheduler.flush()
      expect(requests).toHaveLength(2)
    })
  })

  test('gives up with "Upload did not finish" after 30 seconds', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client} = fakeClient(
        scheduler,
        Array.from({length: 100}, () => pending),
      )
      expectObservable(pollUpload(client, 'uuid-1')).toBe(
        '30000ms #',
        undefined,
        new Error('Upload did not finish'),
      )
    })
  })
})

describe('cancelUpload', () => {
  test('retries 404s, then completes without emitting', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client, requests} = fakeClient(scheduler, [notFound, notFound, {}])
      expectObservable(cancelUpload(client, 'uuid-1')).toBe('600ms |')
      scheduler.flush()
      expect(requests.map(({at}) => at)).toEqual([0, 200, 600])
      for (const {options} of requests) {
        expect(options).toMatchObject({
          url: '/addons/mux/uploads/test/uuid-1',
          method: 'DELETE',
          maxRetries: 0,
        })
      }
    })
  })

  test('gives up quietly on other errors', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client, requests} = fakeClient(scheduler, [forbidden])
      expectObservable(cancelUpload(client, 'uuid-1')).toBe('|')
      scheduler.flush()
      expect(requests).toHaveLength(1)
    })
  })

  test('gives up quietly after a few seconds of 404s', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client} = fakeClient(
        scheduler,
        Array.from({length: 100}, () => notFound),
      )
      expectObservable(cancelUpload(client, 'uuid-1')).toBe('5000ms |')
    })
  })
})
