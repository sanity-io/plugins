import {createClient} from '@sanity/client'
import {defer, NEVER, type Observable, of, throwError} from 'rxjs'
import {TestScheduler} from 'rxjs/testing'
import type {SanityClient} from 'sanity'
import {describe, expect, test} from 'vitest'

import {cancelUpload, pollUpload, uploadedAssetTransaction, withProcessingNotice} from './upload'

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
const badGateway = Object.assign(new Error('Bad gateway'), {statusCode: 502})
const networkError = new Error('Request failed')

/**
 * A client whose requests answer with `responses` in turn (an Error fails the request).
 * Records each request's options and when it was sent.
 */
function fakeClient(scheduler: TestScheduler, responses: unknown[]) {
  const requests: {at: number; options: Record<string, unknown>}[] = []
  const client = {
    config: () => ({dataset: 'test'}),
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
  test('waits a moment, then polls a pending upload with backoff', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client, requests} = fakeClient(scheduler, [pending, pending, pending, ready])
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

  test.each([
    ['404', notFound],
    ['403', forbidden],
  ])('fails straight away on a %s', (_name, error) => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client, requests} = fakeClient(scheduler, [error, ready])
      expectObservable(pollUpload(client, 'uuid-1')).toBe('200ms #', undefined, error)
      scheduler.flush()
      expect(requests).toHaveLength(1)
    })
  })

  test('fails on a 404 after the upload was pending', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client, requests} = fakeClient(scheduler, [pending, notFound, ready])
      expectObservable(pollUpload(client, 'uuid-1')).toBe('400ms #', undefined, notFound)
      scheduler.flush()
      expect(requests).toHaveLength(2)
    })
  })

  test.each([
    ['5xx', badGateway],
    ['network error', networkError],
  ])('retries a %s twice, quickly, then fails with it', (_name, error) => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client, requests} = fakeClient(scheduler, [error, error, error, ready])
      expectObservable(pollUpload(client, 'uuid-1')).toBe('1700ms #', undefined, error)
      scheduler.flush()
      expect(requests.map(({at}) => at)).toEqual([200, 700, 1700])
    })
  })

  test('keeps polling a pending upload after a 5xx', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client, requests} = fakeClient(scheduler, [badGateway, pending, ready])
      expectObservable(pollUpload(client, 'uuid-1')).toBe('1100ms (a|)', {a: ready})
      scheduler.flush()
      expect(requests.map(({at}) => at)).toEqual([200, 700, 1100])
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
  test('unsubscribing stops polling', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client, requests} = fakeClient(
        scheduler,
        Array.from({length: 100}, () => pending),
      )
      expectObservable(pollUpload(client, 'uuid-1'), '^ 1000ms !').toBe('')
      scheduler.flush()
      expect(requests.map(({at}) => at)).toEqual([200, 400, 800])
    })
  })

  test('each poll gets its own budgets', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client} = fakeClient(scheduler, [
        badGateway,
        badGateway,
        ready,
        badGateway,
        badGateway,
        ready,
      ])
      const poll = pollUpload(client, 'uuid-1')
      expectObservable(poll).toBe('1700ms (a|)', {a: ready})
      expectObservable(poll, '2000ms ^').toBe('2000ms 1700ms (a|)', {a: ready})
    })
  })
})

describe('withProcessingNotice', () => {
  test('emits a processing event when the work takes more than 3 seconds', () => {
    const scheduler = createScheduler()
    scheduler.run(({cold, expectObservable}) => {
      expectObservable(withProcessingNotice(cold('5000ms (a|)'))).toBe('3000ms p 1999ms (a|)', {
        p: {type: 'processing'},
        a: 'a',
      })
    })
  })

  test('stays quiet when the work finishes in time', () => {
    const scheduler = createScheduler()
    scheduler.run(({cold, expectObservable}) => {
      expectObservable(withProcessingNotice(cold('1000ms (a|)'))).toBe('1000ms (a|)')
    })
  })

  test('stays quiet when the work fails in time', () => {
    const scheduler = createScheduler()
    scheduler.run(({cold, expectObservable}) => {
      expectObservable(withProcessingNotice(cold('1000ms #'))).toBe('1000ms #')
    })
  })

  test('subscribes to the work once, and unsubscribing stops it', () => {
    const scheduler = createScheduler()
    scheduler.run(({cold, expectObservable, expectSubscriptions}) => {
      const work = cold('5000ms (a|)')
      expectObservable(withProcessingNotice(work), '^ 1000ms !').toBe('')
      expectSubscriptions(work.subscriptions).toBe('^ 1000ms !')
    })
  })
})

describe('cancelUpload', () => {
  test('deletes the upload once, then completes without emitting', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client, requests} = fakeClient(scheduler, [{}])
      expectObservable(cancelUpload(client, 'uuid-1')).toBe('|')
      scheduler.flush()
      expect(requests).toHaveLength(1)
      expect(requests[0]!.options).toMatchObject({
        url: '/addons/mux/uploads/test/uuid-1',
        method: 'DELETE',
        maxRetries: 0,
      })
    })
  })

  test.each([
    ['404', notFound],
    ['403', forbidden],
    ['5xx', badGateway],
    ['network error', networkError],
  ])('gives up quietly on a %s, without retrying', (_name, error) => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const {client, requests} = fakeClient(scheduler, [error, {}])
      expectObservable(cancelUpload(client, 'uuid-1')).toBe('|')
      scheduler.flush()
      expect(requests).toHaveLength(1)
    })
  })

  test('gives up quietly when the request hangs', () => {
    const scheduler = createScheduler()
    scheduler.run(({expectObservable}) => {
      const client = {
        config: () => ({dataset: 'test'}),
        observable: {request: () => NEVER},
      } as unknown as SanityClient
      expectObservable(cancelUpload(client, 'uuid-1')).toBe('5000ms |')
    })
  })
})
