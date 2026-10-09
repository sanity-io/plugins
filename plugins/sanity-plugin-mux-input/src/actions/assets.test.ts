import type {SanityClient} from 'sanity'
import {expect, test, vi} from 'vitest'

import {createPlaybackId} from './assets'
import {RobotsRequestError} from './robots'

function fakeClient(request: (options: Record<string, unknown>) => Promise<unknown>) {
  const requestSpy = vi.fn(request)
  const client = {config: () => ({dataset: 'production'}), request: requestSpy}
  return {client: client as unknown as SanityClient, requestSpy}
}

test('creating a playback ID sends the policy, and the DRM configuration only with drm', async () => {
  const {client, requestSpy} = fakeClient(async () => ({data: {id: 'new', policy: 'signed'}}))
  await createPlaybackId(client, 'asset-1', 'signed', 'drm-1')
  await createPlaybackId(client, 'asset-1', 'drm', 'drm-1')

  expect(requestSpy.mock.calls.map(([options]) => options)).toEqual([
    expect.objectContaining({
      url: '/addons/mux/assets/production/asset-1/playback-ids',
      method: 'POST',
      body: {policy: 'signed'},
    }),
    expect.objectContaining({body: {policy: 'drm', drm_configuration_id: 'drm-1'}}),
  ])
})

test('a proxy without the route answers 404 without a mux key', async () => {
  const {client} = fakeClient(async () => {
    throw Object.assign(new Error('Not Found'), {statusCode: 404, response: {body: {}}})
  })
  const error = await createPlaybackId(client, 'asset-1', 'public').catch((e: unknown) => e)
  expect(error).toBeInstanceOf(RobotsRequestError)
  expect(error).toMatchObject({status: 404, muxAnswered: false})
})
